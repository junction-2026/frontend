import { useFormat, useT } from '../i18n'
import { percent } from '../job/text'
import { Link } from '../router'
import { Mock } from '../ui/MockBadge'
import '../secondary/secondary.css'

// Static showcase of the four edge cases; the real states render on the results, analyzing and history views.
export default function StatesView() {
  const t = useT()
  const { formatNumber } = useFormat()
  return (
    <section className="view">
      <Mock block label={t('results.states.mock')}>
        <div className="page-head">
          <div className="meta-row"><span>{t('results.states.eyebrow')}</span></div>
          <h1>{t('results.states.title')}</h1>
          <p>{t('results.states.lede')}</p>
        </div>

        <div className="edge-grid">
          <article className="card edge-card">
            <div className="edge-card-top">
              <div className="edge-icon warn" aria-hidden="true">⛓</div>
              <span className="status-pill orange">{t('results.states.fault.pill', { code: formatNumber(403, { useGrouping: false }) })}</span>
            </div>
            <h3>{t('results.states.fault.title')}</h3>
            <p>{t('results.states.fault.text')}</p>
            <div className="fault-box">
              <div>{t('results.states.fault.url')}</div>
              <div className="err">{t('results.states.fault.error')}</div>
            </div>
            <div className="remedy-box">
              <strong>{t('results.states.remedy')}</strong>
              <div style={{ marginBlockStart: '0.35rem', color: 'var(--muted)' }}>{t('results.states.remedy.text')}</div>
            </div>
            <div className="edge-actions">
              <Link className="btn-link" href="/">{t('results.states.fault.switch')}</Link>
              <span className="edge-meta">{t('results.states.auto_cleared')}</span>
            </div>
          </article>

          <article className="card edge-card">
            <div className="edge-card-top">
              <span className="status-pill orange">{t('results.states.partial.pill', { ok: formatNumber(6), total: formatNumber(8) })}</span>
              <span className="edge-note">{t('results.states.partial.latency', { value: t('results.metrics.latency_value', { v: formatNumber(3042, { useGrouping: false }) }) })}</span>
            </div>
            <h3>{t('results.states.partial.title')}</h3>
            <p>{t('results.states.partial.integrity', { pct: percent(formatNumber, 0.75) })}</p>
            <div className="bar" style={{ maxWidth: 'none', margin: '0 0 0.7rem' }}><span style={{ width: '75%' }} /></div>
            <div className="pipeline-grid">
              <div>{t('results.states.partial.linguistic')}</div>
              <div>{t('results.states.partial.persuasion')}</div>
              <div>{t('results.states.partial.claims')}</div>
              <div className="skip">{t('results.states.partial.wire')}</div>
            </div>
            <div className="info-box">{t('results.states.partial.info')}</div>
            <div className="edge-actions">
              <Link className="btn-primary" href="/history">{t('results.states.partial.view')}</Link>
              <Mock label={t('results.states.partial.retry_label')}>
                <button type="button" className="btn-secondary" disabled>{t('results.states.partial.retry')}</button>
              </Mock>
            </div>
          </article>

          <article className="card edge-card">
            <div className="edge-card-top">
              <span className="status-pill purple">{t('results.states.uncertain.pill')}</span>
              <span className="edge-note">{t('results.states.uncertain.entropy', { value: formatNumber(0.88, { minimumFractionDigits: 2 }) })}</span>
            </div>
            <h3>{t('results.states.uncertain.title')}</h3>
            <p>{t('results.states.uncertain.text')}</p>
            <div className="info-box">{t('results.states.uncertain.info')}</div>
            <div className="edge-actions">
              <Link className="btn-secondary" href="/ask">{t('results.states.uncertain.ask')}</Link>
              <Link className="btn-link" href="/">{t('results.states.uncertain.more')}</Link>
            </div>
          </article>

          <article className="card edge-card">
            <div className="edge-card-top">
              <div className="edge-icon ok" aria-hidden="true">☰</div>
              <span className="status-pill green">{t('results.states.fresh.pill')}</span>
            </div>
            <h3>{t('results.states.fresh.title')}</h3>
            <p>{t('results.states.fresh.text')}</p>
            <div className="edge-actions">
              <Link className="btn-primary" href="/">{t('results.states.fresh.start')}</Link>
              <Link className="btn-link" href="/history">{t('results.states.fresh.history')}</Link>
            </div>
          </article>
        </div>
      </Mock>
    </section>
  )
}
