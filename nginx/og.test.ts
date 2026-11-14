import { readdirSync, readFileSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// @ts-expect-error plain ES module for njs, no type declarations
import og from './og.js'

const { cardForJob, genericCard, injectHead, jobIdOf, renderHead } = og

const O = 'https://stiriri.dev'
type J = Record<string, unknown>
const done = (verdict: unknown, user_text = 'Because.', extra: J = {}): J => ({
  id: 'abc', status: 'completed', done: true, input: { content: 'SECRET INPUT', source: { title: 'SECRET TITLE' } },
  scrape: { url: 'https://secret.example/x' },
  finalization: { status: 'completed', result: { verdict, confidence: 0.8731, user_text, produced_by: 'x' } }, ...extra,
})
const head = (job: J | null) => renderHead(cardForJob(O, 'abc', job))
const meta = (h: string, key: string) => new RegExp(`(?:property|name)="${key}" content="([^"]*)"`).exec(h)?.[1]

describe('generic card', () => {
  const h = renderHead(genericCard(O + '/'))
  it('emits the full tag set', () => {
    const want: Record<string, string> = {
      'og:type': 'website', 'og:site_name': 'VEIL', 'og:title': 'VEIL / Intelligence', 'og:url': O + '/', 'og:image': O + '/og/site.png',
      'og:image:width': '1200', 'og:image:height': '630', 'og:image:type': 'image/png', 'twitter:card': 'summary_large_image',
      'twitter:title': 'VEIL / Intelligence', 'twitter:image': O + '/og/site.png',
    }
    for (const [k, v] of Object.entries(want)) expect(meta(h, k), k).toBe(v)
    for (const k of ['description', 'og:description', 'og:image:alt', 'twitter:description', 'twitter:image:alt']) expect(meta(h, k), k).toBeTruthy()
    expect(meta(h, 'og:description')!.length).toBeLessThanOrEqual(200)
    expect(h).toContain('<title>VEIL / Intelligence</title>')
  })
  it('strips trailing slashes of PUBLIC_ORIGIN', () => {
    expect(genericCard(O + '//').image).toBe(O + '/og/site.png')
    expect(cardForJob(O + '/', 'abc', done('detected')).url).toBe(O + '/jobs/abc')
  })
  it('defaults to http://localhost', () => expect(genericCard('').url).toBe('http://localhost/'))
})

describe('verdict card', () => {
  it.each([
    ['detected', 'Manipulation detected', 'Yes, propaganda detected.'],
    ['not_detected', 'No manipulation indicators', 'No clear signs of propaganda.'],
    ['uncertain', 'Uncertain', "We're not sure yet."],
    ['suspicious', 'Uncertain', "We're not sure yet."], // unknown verdict reads as uncertain
    [undefined, 'Uncertain', "We're not sure yet."],
  ])('%s', (verdict, label, heading) => {
    const c = cardForJob(O, 'abc', done(verdict))
    const key = verdict === 'detected' || verdict === 'not_detected' ? verdict : 'uncertain'
    expect(c).toMatchObject({ type: 'article', title: `VEIL verdict: ${label}`, description: `${heading} Because.`, url: `${O}/jobs/abc`, image: `${O}/og/verdict-${key}.png` })
    expect(c.imageAlt).toContain(label)
  })
  it('collapses whitespace and handles empty user_text', () => {
    expect(cardForJob(O, 'abc', done('detected', ' a \n\n b\t c ')).description).toBe('Yes, propaganda detected. a b c')
    expect(cardForJob(O, 'abc', done('detected', '  ')).description).toBe('Yes, propaganda detected.')
  })
  it('truncates to 200 code points without cutting a surrogate pair', () => {
    const heading = 'Yes, propaganda detected. '
    const text = 'x'.repeat(200 - heading.length - 2) + '😀😀😀' // the second emoji straddles the limit
    const d = cardForJob(O, 'abc', done('detected', text)).description
    expect([...d].length).toBeLessThanOrEqual(200)
    expect(d.endsWith('😀…')).toBe(true)
    expect(d).not.toMatch(/[\ud800-\udbff](?![\udc00-\udfff])/)
    expect(cardForJob(O, 'abc', done('detected', 'y'.repeat(500))).description).toHaveLength(200)
  })
  it('escapes user_text after truncation', () => {
    const h = head(done('detected', `<script>"'&`))
    expect(h).toContain('&lt;script&gt;&quot;&#39;&amp;')
    expect(h).not.toContain('<script>')
    // the escape is applied after truncating, so a cut never lands inside an entity
    const long = head(done('detected', '&'.repeat(300)))
    expect(meta(long, 'og:description')).toMatch(/^Yes, propaganda detected\. (&amp;)+…$/)
  })
  it('never includes input, source, scrape or confidence', () => {
    const h = head(done('detected'))
    for (const s of ['SECRET', 'secret.example', '0.8731', '87', 'confidence']) expect(h).not.toContain(s)
  })
})

describe('neutral cards', () => {
  const pending = { title: 'VEIL analysis in progress', image: O + '/og/pending.png', description: 'The analysis of this content is still running. Open the link to follow it live.' }
  const unavailable = { title: 'VEIL analysis unavailable', image: O + '/og/unavailable.png', description: 'No final assessment is available for this analysis.' }
  it.each([
    ['not done', { done: false, status: 'running', finalization: { status: 'pending', result: null } }, pending],
    ['finalization running', done('detected', 'x', { finalization: { status: 'running', result: null } }), pending],
    ['failed job', done('detected', 'x', { status: 'failed' }), unavailable],
    ['cancelled job', done('detected', 'x', { status: 'cancelled' }), unavailable],
    ['finalization skipped', done('detected', 'x', { finalization: { status: 'skipped', result: null } }), unavailable],
    ['finalization failed', done('detected', 'x', { finalization: { status: 'failed', result: null } }), unavailable],
    ['result null', done('detected', 'x', { finalization: { status: 'completed', result: null } }), unavailable],
  ])('%s', (_n, job, want) => {
    const c = cardForJob(O, 'abc', job as J)
    expect(c).toMatchObject({ ...want, url: `${O}/jobs/abc` })
    expect(c.description).not.toMatch(/propaganda|manipulation/i)
  })
})

describe('fallbacks and routing', () => {
  it('null job (404, error, timeout) and malformed id give the generic card', () => {
    expect(cardForJob(O, 'abc', null)).toEqual(genericCard(O))
    expect(cardForJob(O, 'a b', done('detected'))).toEqual(genericCard(O))
    expect(cardForJob(O, 'x'.repeat(65), done('detected'))).toEqual(genericCard(O))
  })
  it('jobIdOf', () => {
    expect(jobIdOf('/jobs/abc')).toBe('abc')
    expect(jobIdOf('/jobs/abc/detail')).toBe('abc')
    expect(jobIdOf('/jobs/abc/live')).toBe('abc')
    expect(jobIdOf('/jobs/a%20b')).toBe('')
    expect(jobIdOf('/jobs/a.b')).toBe('')
    for (const p of ['/', '/ask', '/history', '/jobs', '/jobs/abc/other', '/jobs/abc/detail/x']) expect(jobIdOf(p)).toBeNull()
  })
  it('injectHead replaces the marked block instead of duplicating it', () => {
    const html = '<head>\n<!-- og:start -->\n<title>old</title>\n<!-- og:end -->\n</head>'
    const out = injectHead(html, renderHead(genericCard(O)))
    expect(out.match(/og:start/g)).toHaveLength(1)
    expect(out).not.toContain('old')
    expect(injectHead('<head></head>', 'X')).toBe('<head>X\n  </head>')
  })
  it('source index.html carries the default card with root-relative images', () => {
    const src = readFileSync('index.html', 'utf8')
    expect(src).toContain('<!-- og:start -->')
    expect(meta(src, 'og:image')).toBe('/og/site.png')
    expect(meta(src, 'twitter:card')).toBe('summary_large_image')
    expect(meta(src, 'og:description')).toBe(genericCard(O).description)
  })
})

describe('public/og images', () => {
  const dir = 'public/og'
  const files = ['site', 'verdict-detected', 'verdict-not_detected', 'verdict-uncertain', 'pending', 'unavailable'].map((n) => `${n}.png`)
  it('has exactly the card images', () => expect(readdirSync(dir).sort()).toEqual([...files].sort()))
  it.each(files)('%s is a 1200x630 PNG of at most 300 KB', (f) => {
    const b = readFileSync(`${dir}/${f}`)
    expect(b.subarray(1, 4).toString()).toBe('PNG')
    expect([b.readUInt32BE(16), b.readUInt32BE(20)]).toEqual([1200, 630])
    expect(statSync(`${dir}/${f}`).size).toBeLessThanOrEqual(300 * 1024)
  })
})
