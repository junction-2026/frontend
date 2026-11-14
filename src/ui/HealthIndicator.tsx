import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import { checkHealth, type HealthResult } from '../health'

export function HealthIndicator() {
  const t = useT()
  const [result, setResult] = useState<HealthResult | null>(null)

  useEffect(() => {
    let active = true
    void checkHealth().then((r) => {
      if (active) setResult(r)
    })
    return () => {
      active = false
    }
  }, [])

  if (!result)
    return (
      <span className="health" role="status">
        <span className="dot" /> {t('shell.health.checking')}
      </span>
    )
  if (!result.ok)
    return (
      <span className="health offline" role="alert" title={t('shell.health.failed', { detail: result.kind === 'timeout' ? t('shell.health.timeout', { ms: result.detail }) : result.kind === 'body' ? `${t('shell.health.bad_body')} ${result.detail}` : result.detail })}>
        <span className="dot" /> {t('shell.health.offline')}
      </span>
    )
  return (
    <span className="health online">
      <span className="dot" /> {t('shell.health.online')}
    </span>
  )
}
