import { useEffect, useState } from 'react'
import { listAnalyzers } from '../api/client'
import { errorMessage } from '../api/errors'
import type { AnalyzerInfo, ApiError } from '../api/types'
import { useT } from '../i18n'

type State = { items: AnalyzerInfo[] } | { error: ApiError } | null

// The only backend-connected part of Settings: read-only, so it is not wrapped in Mock.
export function AnalyzersBlock() {
  const t = useT()
  const [state, setState] = useState<State>(null)

  useEffect(() => {
    let active = true
    void listAnalyzers().then((r) => {
      if (!active) return
      setState(r.ok ? { items: Array.isArray(r.data.items) ? r.data.items : [] } : { error: r.error })
    })
    return () => {
      active = false
    }
  }, [])

  const items = state && 'items' in state ? state.items : []
  const enabled = items.filter((a) => a.enabled === true).length

  return (
    <section className="card settings-block" aria-label={t('settings.analyzers.title')}>
      <div className="settings-block-head">
        <span>{t('settings.analyzers.title')}</span>
        {state && 'items' in state && (
          <span className="status-pill green">{t('settings.analyzers.enabled_count', { enabled, total: items.length })}</span>
        )}
      </div>
      {!state && <p role="status">{t('settings.analyzers.loading')}</p>}
      {state && 'error' in state && <p role="alert">{errorMessage(state.error)}</p>}
      {state && 'items' in state && items.length === 0 && <p>{t('settings.analyzers.none')}</p>}
      {items.map((a) => {
        const deps = Array.isArray(a.depends_on) ? a.depends_on : []
        return (
          <div className="analyzer-row" key={a.id}>
            <div className="analyzer-main">
              <div className="icon" aria-hidden="true">◈</div>
              <div>
                <h4>
                  {a.name} <span className="badge-soft">{a.id}</span>
                  {a.trigger === 'after_all_analyzers_settled' && <span className="badge-blue">{t('settings.analyzers.final')}</span>}
                  {a.selectable === false && <span className="badge-soft">{t('settings.analyzers.not_selectable')}</span>}
                </h4>
                <p>
                  {t('settings.analyzers.category', { category: a.category })}
                  {deps.length > 0 && ` · ${t('settings.analyzers.depends_on', { ids: deps.join(', ') })}`}
                </p>
              </div>
            </div>
            <span className={a.enabled ? 'status-pill green' : 'status-pill gray'}>{a.enabled ? t('settings.analyzers.enabled') : t('settings.analyzers.disabled')}</span>
          </div>
        )
      })}
    </section>
  )
}
