import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const script = resolve(process.cwd(), 'docker/40-check-public-origin.sh') // vitest runs from the repo root
const run = (origin: string | undefined) => {
  const env: Record<string, string> = { PATH: process.env.PATH ?? '' }
  if (origin !== undefined) env.PUBLIC_ORIGIN = origin
  return spawnSync('sh', [script], { env, encoding: 'utf8' })
}

describe('public origin startup check', () => {
  it.each([
    undefined, '', 'http://localhost', 'http://LOCALHOST:8080', 'http://127.0.0.1:8081', 'http://[::1]',
    'localhost:8080', 'ftp://veil.example', 'https://veil.example/app', 'https://veil.example?x=1',
    'http://:8080', 'https://veil.example:abc', 'https://veil.example:', 'http://[]',
  ])('warns for %j', (origin) => {
    const r = run(origin)
    expect(r.status).toBe(0)
    expect(r.stdout).toBe('')
    expect(r.stderr.trim().split('\n')).toHaveLength(1)
    expect(r.stderr).toMatch(/^WARNING: PUBLIC_ORIGIN="/)
    expect(r.stderr).toContain(`PUBLIC_ORIGIN="${origin ?? ''}"`)
  })

  it.each(['https://veil.example', 'https://veil.example/', 'http://veil.example:8443', 'http://[2001:db8::1]:8443'])('is silent for %j', (origin) => {
    const r = run(origin)
    expect(r.status).toBe(0)
    expect(r.stderr).toBe('')
    expect(r.stdout).toBe('')
  })
})
