// njs entry point: answers HTML routes with index.html plus the link-preview card for the requested route.
import fs from 'fs'
import og from './og.js' // njs supports default imports only

const INDEX = '/usr/share/nginx/html/index.html'
const TIMEOUT_MS = 2000
let index // cached per worker

async function fetchJob(r, id) {
  let timer
  const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve(null), TIMEOUT_MS) })
  const request = r.subrequest('/api/v1/jobs/' + id).then((res) => {
    if (res.status !== 200) return null
    try { return JSON.parse(res.responseText) } catch (e) { return null }
  }, () => null)
  const job = await Promise.race([request, timeout])
  clearTimeout(timer)
  return job
}

async function html(r) {
  const origin = r.variables.og_origin
  try {
    if (index === undefined) index = fs.readFileSync(INDEX, 'utf8')
    const id = og.jobIdOf(r.uri)
    const card = id ? og.cardForJob(origin, id, await fetchJob(r, id)) : og.genericCard(origin)
    r.headersOut['Content-Type'] = 'text/html; charset=utf-8'
    r.headersOut['Cache-Control'] = 'no-cache'
    r.return(200, og.injectHead(index, og.renderHead(card)))
  } catch (e) {
    r.error('og: ' + e) // never an error page: fall back to the plain SPA shell
    r.internalRedirect('@plain')
  }
}

export default { html }
