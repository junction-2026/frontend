// Stub backend for scripts/og-smoke.sh: serves fixture jobs on GET /api/v1/jobs/{id}.
import http from 'node:http'

const fin = (status, result) => ({ status, result })
const job = (extra) => ({ id: 'x', status: 'completed', done: true, input: { content: 'SECRET INPUT' }, ...extra })
const FIXTURES = {
  detected: job({ finalization: fin('completed', { verdict: 'detected', confidence: 0.91, user_text: 'Loaded <b>language</b> & "fear" appeals.', produced_by: 'stub' }) }),
  running: job({ status: 'running', done: false, finalization: fin('pending', null) }),
  failed: job({ status: 'failed', finalization: fin('skipped', null) }),
}

http.createServer((req, res) => {
  const id = /^\/api\/v1\/jobs\/([^/]+)$/.exec(req.url)?.[1]
  const send = (code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)) }
  if (id === 'slow') return setTimeout(() => send(200, FIXTURES.detected), 4000) // exceeds the 2 s card timeout
  if (id === 'boom') return send(500, { error: 'boom' })
  if (id && FIXTURES[id]) return send(200, { ...FIXTURES[id], id })
  send(404, { error: { code: 'not_found', message: 'job not found' } })
}).listen(8080)
