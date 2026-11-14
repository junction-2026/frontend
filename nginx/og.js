// Link-preview card renderer. Pure and dependency-free: runs under njs (no Node APIs) and under vitest.

const DESCRIPTION_MAX = 200
const SITE_DESCRIPTION = 'VEIL analyzes posts and articles for signs of propaganda and manipulation techniques.'
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/
const JOB_PATH_RE = /^\/jobs\/([^/]+)(?:\/(?:detail|live))?$/

const VERDICTS = {
  detected: { label: 'Manipulation detected', heading: 'Yes, propaganda detected.' },
  not_detected: { label: 'No manipulation indicators', heading: 'No clear signs of propaganda.' },
  uncertain: { label: 'Uncertain', heading: "We're not sure yet." },
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

// Truncate on a code-point boundary to at most `max` code points, ending in '…' when cut.
// Index loop with charCodeAt: njs 0.9 has no for...of or default parameters.
function truncate(s, max) {
  let n = 0 // code points seen
  let cut = 0 // string index after max-1 code points
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) i++ // surrogate pair is one code point
    n++
    if (n === max - 1) cut = i + 1
  }
  return n <= max ? s : s.slice(0, cut).trimEnd() + '…'
}

const normalizeOrigin = (origin) => String(origin || 'http://localhost').replace(/\/+$/, '')

function genericCard(origin) {
  const o = normalizeOrigin(origin)
  return {
    type: 'website',
    title: 'VEIL / Intelligence',
    description: SITE_DESCRIPTION,
    url: o + '/',
    image: o + '/og/site.png',
    imageAlt: 'VEIL / Intelligence: propaganda and manipulation analysis',
  }
}

// Job id of a card route (/jobs/{id}, /jobs/{id}/detail, /jobs/{id}/live): null for other paths, '' for a malformed id.
function jobIdOf(path) {
  const m = JOB_PATH_RE.exec(path)
  if (!m) return null
  return ID_RE.test(m[1]) ? m[1] : ''
}

function cardForJob(origin, id, job) {
  const o = normalizeOrigin(origin)
  if (!job || typeof job !== 'object' || !ID_RE.test(id)) return genericCard(origin)
  const url = o + '/jobs/' + id
  const fin = job.finalization && typeof job.finalization === 'object' ? job.finalization : {}
  const card = (title, description, image, imageAlt) => ({ type: 'article', title, description, url, image: o + image, imageAlt })

  if (job.done !== true || fin.status === 'pending' || fin.status === 'running') {
    return card('VEIL analysis in progress', 'The analysis of this content is still running. Open the link to follow it live.', '/og/pending.png', 'VEIL analysis in progress')
  }
  const r = fin.result
  if (job.status === 'failed' || job.status === 'cancelled' || fin.status !== 'completed' || !r || typeof r !== 'object') {
    return card('VEIL analysis unavailable', 'No final assessment is available for this analysis.', '/og/unavailable.png', 'VEIL analysis unavailable')
  }
  // Any verdict value other than the two known ones reads as uncertain (analysis-jobs-api, Verdict values).
  const key = r.verdict === 'detected' || r.verdict === 'not_detected' ? r.verdict : 'uncertain'
  const v = VERDICTS[key]
  const text = typeof r.user_text === 'string' ? r.user_text.replace(/\s+/g, ' ').trim() : ''
  return card('VEIL verdict: ' + v.label, truncate(text ? v.heading + ' ' + text : v.heading, DESCRIPTION_MAX), '/og/verdict-' + key + '.png', 'VEIL verdict: ' + v.label)
}

function renderHead(card) {
  const meta = (attr, name, content) => `<meta ${attr}="${name}" content="${esc(content)}" />`
  return [
    '<!-- og:start -->',
    `<title>${esc(card.title)}</title>`,
    meta('name', 'description', card.description),
    meta('property', 'og:type', card.type || 'website'),
    meta('property', 'og:site_name', 'VEIL'),
    meta('property', 'og:title', card.title),
    meta('property', 'og:description', card.description),
    meta('property', 'og:url', card.url),
    meta('property', 'og:image', card.image),
    meta('property', 'og:image:width', '1200'),
    meta('property', 'og:image:height', '630'),
    meta('property', 'og:image:type', 'image/png'),
    meta('property', 'og:image:alt', card.imageAlt),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', card.title),
    meta('name', 'twitter:description', card.description),
    meta('name', 'twitter:image', card.image),
    meta('name', 'twitter:image:alt', card.imageAlt),
    '<!-- og:end -->',
  ].join('\n    ')
}

// Replace the default card block (og:start..og:end) in index.html, or insert before </head> when it is missing.
function injectHead(html, head) {
  const a = html.indexOf('<!-- og:start -->')
  const b = html.indexOf('<!-- og:end -->')
  if (a !== -1 && b > a) return html.slice(0, a) + head + html.slice(b + '<!-- og:end -->'.length)
  return html.replace('</head>', () => head + '\n  </head>')
}

// njs supports only a default export (no named exports), so everything is exposed on this one object.
export default { truncate, normalizeOrigin, genericCard, jobIdOf, cardForJob, renderHead, injectHead }
