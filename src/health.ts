import { tActive as t } from './i18n'

export const HEALTH_TIMEOUT_MS = 5000

export type HealthResult = { ok: true } | { ok: false; message: string }

// Never throws: every failure is returned as { ok: false, message } with the failure in the active locale.
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
    if (!response.ok) return { ok: false, message: t('shell.health.failed', { detail: `HTTP ${response.status} ${response.statusText}` }) }
    const text = await response.text()
    let body: unknown
    try {
      body = JSON.parse(text)
    } catch {
      body = undefined
    }
    const status = typeof body === 'object' && body !== null ? (body as { status?: unknown }).status : undefined
    if (response.status === 200 && status === 'ok') return { ok: true }
    return { ok: false, message: t('shell.health.failed', { detail: `${t('shell.health.bad_body')} ${text.slice(0, 200)}` }) }
  } catch (error) {
    if (timedOut) return { ok: false, message: t('shell.health.failed', { detail: t('shell.health.timeout', { ms: HEALTH_TIMEOUT_MS }) }) }
    return { ok: false, message: t('shell.health.failed', { detail: error instanceof Error ? error.message : String(error) }) }
  } finally {
    clearTimeout(timer)
  }
}
