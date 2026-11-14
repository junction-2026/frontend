import { forwardRef } from 'react'
import { errorMessage } from '../../api/errors'
import type { MapAnalysis } from '../../api/mapTypes'
import { useFormat, useT } from '../../i18n'
import { Skeleton } from '../../job/WithJob'
import { Link } from '../../router'
import { useCountryAnalyses } from './model'

const STRENGTHS = ['strong', 'weak']

function Item({ a }: { a: MapAnalysis }) {
  const t = useT()
  const { formatDate } = useFormat()
  const when = a.created_at && !Number.isNaN(Date.parse(a.created_at)) ? formatDate(a.created_at, { dateStyle: 'medium' }) : null
  return (
    <li className="related-card">
      <Link href={`/jobs/${encodeURIComponent(a.job_id)}`} dir="auto">{a.source.title ?? (a.snippet || a.job_id)}</Link>
      <div className="related-meta">
        {a.outlet && <span><bdi>{a.outlet.name}</bdi></span>}
        {when && <span>{when}</span>}
        {a.verdict && <span className="tag gray">{t(`history.verdict.${a.verdict === 'detected' || a.verdict === 'not_detected' ? a.verdict : 'uncertain'}`)}</span>}
      </div>
      {a.techniques.length > 0 && (
        <ul className="technique-chips" aria-label={t('explore.pmap.techniques')}>
          {a.techniques.map((x) => (
            <li key={x.name} className="tag orange">
              <bdi>{x.display}</bdi>
              {x.strength && <small>{' · '}{STRENGTHS.includes(x.strength) ? t(`explore.pmap.strength.${x.strength}`) : <bdi>{x.strength}</bdi>}</small>}
            </li>
          ))}
        </ul>
      )}
      {a.source.title && a.snippet && <p dir="auto">{a.snippet}</p>}
    </li>
  )
}

// A labelled region listing one country's analyses; focus lands on it when it opens (tabIndex -1).
export const Panel = forwardRef<HTMLElement, { code: string; name: string; onClose: () => void }>(function Panel({ code, name, onClose }, ref) {
  const t = useT()
  const { state, retry, loadMore } = useCountryAnalyses(code)
  const titleId = `pmap-panel-${code}`
  return (
    <section ref={ref} tabIndex={-1} className="country-panel pmap-panel" aria-labelledby={titleId}>
      <div className="pmap-panel-head">
        <strong id={titleId}><bdi>{name}</bdi></strong>
        <button type="button" className="btn-link" onClick={onClose}>{t('explore.pmap.close')}</button>
      </div>
      {state.status === 'loading' && <Skeleton />}
      {state.status === 'error' && (
        <>
          <p role="alert" className="state-error">{errorMessage(state.error)}</p>
          <button type="button" className="btn-secondary" onClick={retry}>{t('explore.retry')}</button>
        </>
      )}
      {state.status === 'ready' && (
        <>
          {state.data.items.length === 0 ? <p className="explore-note">{t('explore.pmap.panel_empty', { country: name })}</p> : (
            <ul className="related-list">{state.data.items.map((a) => <Item key={a.job_id} a={a} />)}</ul>
          )}
          {state.data.more === 'error' && <p role="alert" className="state-error">{t('explore.pmap.more_failed')}</p>}
          {state.data.next && (
            <button type="button" className="btn-secondary" disabled={state.data.more === 'loading'} onClick={loadMore}>{t('explore.pmap.load_more')}</button>
          )}
        </>
      )}
    </section>
  )
})
