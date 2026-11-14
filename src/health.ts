export const HEALTH_TIMEOUT_MS = 5000

export type HealthResult = { ok: true } | { ok: false; message: string }

const PREFIX = 'Backend health check failed:'

// Never throws: every failure is returned as { ok: false, message }.
export async function checkHealth(fetchImpl: typeof fetch = fetch): Promise<HealthResult> {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, HEALTH_TIMEOUT_MS)
  try {
    const response = await fetchImpl('/healthz', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    if (!response.ok) return { ok: false, message: `${PREFIX} HTTP ${response.status} ${response.statusText}` }
    const text = await response.text()
    let body: unknown
    try {
      body = JSON.parse(text)
    } catch {
      body = undefined
    }
    const status = typeof body === 'object' && body !== null ? (body as { status?: unknown }).status : undefined
    if (response.status === 200 && status === 'ok') return { ok: true }
    return { ok: false, message: `${PREFIX} unexpected response body ${text.slice(0, 200)}` }
  } catch (error) {
    if (timedOut) return { ok: false, message: `${PREFIX} timed out after ${HEALTH_TIMEOUT_MS} ms` }
    return { ok: false, message: `${PREFIX} ${error instanceof Error ? error.message : String(error)}` }
  } finally {
    clearTimeout(timer)
  }
}
