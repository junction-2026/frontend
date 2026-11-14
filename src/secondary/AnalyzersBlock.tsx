import { useEffect, useState } from 'react'
import { listAnalyzers } from '../api/client'
import { errorMessage } from '../api/errors'
import type { AnalyzerInfo } from '../api/types'

type State = { items: AnalyzerInfo[] } | { error: string } | null

// The only backend-connected part of Settings: read-only, so it is not wrapped in Mock.
export function AnalyzersBlock() {
  const [state, setState] = useState<State>(null)

  useEffect(() => {
    let active = true
    void listAnalyzers().then((r) => {
      if (!active) return
      setState(r.ok ? { items: Array.isArray(r.data.items) ? r.data.items : [] } : { error: errorMessage(r.error) })
    })
    return () => {
      active = false
    }
  }, [])

  const items = state && 'items' in state ? state.items : []
  const enabled = items.filter((a) => a.enabled === true).length

  return (
    <section className="card settings-block" aria-label="Active AI analyzers & ensembles">
      <div className="settings-block-head">
        <span>Active AI analyzers &amp; ensembles</span>
        {state && 'items' in state && (
          <span className="status-pill green">● {enabled} of {items.length} analyzers enabled</span>
        )}
      </div>
      {!state && <p role="status">Loading analyzers…</p>}
      {state && 'error' in state && <p role="alert">{state.error}</p>}
      {state && 'items' in state && items.length === 0 && <p>No analyzers are configured.</p>}
      {items.map((a) => {
        const deps = Array.isArray(a.depends_on) ? a.depends_on : []
        return (
          <div className="analyzer-row" key={a.id}>
            <div className="analyzer-main">
              <div className="icon" aria-hidden="true">◈</div>
              <div>
                <h4>
                  {a.name} <span className="badge-soft">{a.id}</span>
                  {a.trigger === 'after_all_analyzers_settled' && <span className="badge-blue">Final assessment</span>}
                  {a.selectable === false && <span className="badge-soft">Not selectable</span>}
                </h4>
                <p>
                  Category: {a.category}
                  {deps.length > 0 && ` · Depends on: ${deps.join(', ')}`}
                </p>
              </div>
            </div>
            <span className={a.enabled ? 'status-pill green' : 'status-pill gray'}>{a.enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        )
      })}
    </section>
  )
}
