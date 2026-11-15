import { useId, useState, type ReactNode } from 'react'
import type { Job } from '../api/types'
import { useFormat, useLocale, useT } from '../i18n'
import { CATALOGS } from '../i18n/translate'
import { useFocusPick, useFocusSelection } from './focusSelection'
import { techniqueText } from './read'
import { readRisk, type RiskView } from './risk'
import { enumLabel, percent } from './text'
import './riskScore.css'

const BANDS = ['low', 'moderate', 'high', 'critical']
// A key this client's catalog lacks (a newer server id) falls back to the server text.
const known = (key: string) => CATALOGS.en[key] !== undefined

function RiskInfo() {
  const t = useT()
  const id = useId()
  const [open, setOpen] = useState(false)
  return (
    <span className="confidence-info">
      <button
        type="button"
        className="info-btn"
        aria-label={t('results.risk.info_label')}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      >
        <span aria-hidden="true">i</span>
      </button>
      {open && <span role="tooltip" id={id} className="confidence-tip">{t('results.risk.info_tip')}</span>}
    </span>
  )
}

// Shared disclosure of Main drivers and Caveats: one collapsed-by-default button with the section-heading style.
function Disclosure({ label, region, items }: { label: string; region: string; items: ReactNode[] }) {
  const id = useId()
  const [open, setOpen] = useState(useFocusSelection() !== null) // toggles inside must be visible
  return (
    <div className="risk-block">
      <button type="button" className="risk-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        {label}
        <span aria-hidden="true" className="risk-chevron mirror-rtl">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div id={id} role="region" aria-label={region}>
          <ul className="risk-list">{items}</ul>
        </div>
      )}
    </div>
  )
}

// First COMPACT entries; the rest behind a Show all / Show less toggle (all entries stay reachable).
const COMPACT = 3
function Collapsible({ className, items }: { className: string; items: ReactNode[] }) {
  const t = useT()
  const fmt = useFormat().formatNumber
  const id = useId()
  const [all, setAll] = useState(false)
  return (
    <>
      <ul id={id} className={`risk-list ${className}`}>{all ? items : items.slice(0, COMPACT)}</ul>
      {items.length > COMPACT && (
        <button type="button" className="risk-more" aria-expanded={all} aria-controls={id} onClick={() => setAll(!all)}>
          {all ? t('results.risk.show_less') : t('results.risk.show_all', { n: fmt(items.length) })}
        </button>
      )}
    </>
  )
}

export function RiskSection({ risk }: { risk: RiskView }) {
  const t = useT()
  const { locale } = useLocale()
  const fmt = useFormat().formatNumber
  const nameOf = (label: string) => {
    const d = risk.techniques.find((x) => x.label === label)?.display
    return techniqueText(label, locale, 'en', { name: d || undefined }).name
  }
  const bandKnown = risk.band !== null && BANDS.includes(risk.band)
  const first = risk.drivers[0]
  const driverKnown = !!first && (first.kind === 'technique' ? !!first.technique : first.kind === 'none' || known(`results.risk.driver_short.${first.kind}`))
  // Summary composed from the catalog; the server sentence only when the band or the first driver kind is unknown to this client.
  const driverPhrase = !first ? '' : first.kind === 'technique' ? nameOf(first.technique ?? '') : known(`results.risk.driver_short.${first.kind}`) ? t(`results.risk.driver_short.${first.kind}`) : ''
  const summary = bandKnown && driverKnown
      ? `${t(`results.risk.summary.${risk.band}`)} ${first.kind === 'none' ? t('results.risk.summary.none') : t('results.risk.summary.main', { driver: driverPhrase })}`
      : risk.summary
  const sentence = (d: RiskView['drivers'][number]) =>
    d.kind === 'technique' ? (d.technique ? t('results.risk.driver.technique', { technique: nameOf(d.technique) }) : d.text) : known(`results.risk.driver.${d.kind}`) ? t(`results.risk.driver.${d.kind}`) : d.text
  const heading = useId()
  const pick = useFocusPick()
  return (
    <section className="card risk" aria-labelledby={heading} data-risk={risk.scored ? 'scored' : 'unavailable'}>
      <div className="risk-head">
        <h3 id={heading} className="risk-title">{t('results.risk.title')}</h3>
        <RiskInfo />
      </div>
      {risk.scored ? (
        <p className="risk-summary">{summary}</p>
      ) : (
        <p className="risk-unavailable">
          {t('results.risk.unavailable')} {t(known(`results.risk.unavailable_reason.${risk.reason}`) ? `results.risk.unavailable_reason.${risk.reason}` : 'results.risk.unavailable_reason.unknown')}
        </p>
      )}

      <div className="risk-block">
        <h3 className="risk-subtitle">{t('results.risk.breakdown')}</h3>
        <ul className="risk-list risk-dims">
          {risk.dimensions.map((d) => {
            const label = t(`results.risk.dim.${d.key}`)
            const pct = d.score === null ? 0 : Math.round(d.score * 100)
            const reason = known(`results.risk.reason.${d.reason}`) ? d.reason : 'unknown'
            const ask = d.available ? pick('risk_dimension', d.key) : null
            const short = d.available ? '' : t(`results.risk.reason_short.${known(`results.risk.reason_short.${d.reason}`) ? d.reason : 'unknown'}`)
            return (
              <li key={d.key} className="risk-dim" data-focus-selected={ask?.selected || undefined}>
                <div className="risk-dim-row">
                  <span className="risk-dim-label">{label}</span>
                  {d.available && d.low && <span className="risk-low">{t('results.risk.low_confidence')}</span>}
                  <span className={d.available ? 'risk-dim-value' : 'risk-dim-value risk-dim-na'}>{d.available ? percent(fmt, pct / 100) : t('results.risk.na')}</span>
                  {ask?.button}
                </div>
                {d.available ? (
                  <div className="risk-meter" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={percent(fmt, pct / 100)}>
                    <span style={{ inlineSize: `${pct}%` }} />
                  </div>
                ) : (
                  <div className="risk-meter" aria-hidden="true"><span style={{ inlineSize: 0 }} /></div>
                )}
                <p className="risk-dim-note" title={short || undefined}>
                  {short && <span aria-hidden="true">{short}</span>}
                  {!d.available && <span className="sr-only">{t(`results.risk.reason.${reason}`, { dimension: label })}</span>}
                </p>
              </li>
            )
          })}
        </ul>
      </div>

      {/* With intensity unavailable the list is empty because the check did not run, not because nothing was found: show nothing (the dimension note explains it). */}
      {(risk.techniques.length > 0 || risk.dimensions[0].available) && (
      <div className="risk-block">
        <h3 className="risk-subtitle">{t('results.risk.techniques')}</h3>
        {risk.techniques.length === 0 ? (
          <p className="risk-note">{t('results.risk.techniques_none')}</p>
        ) : (
          <Collapsible
            className="risk-techniques"
            items={risk.techniques.map((x) => (
              <li key={x.label}>
                <span className="risk-tech-name">{techniqueText(x.label, locale, 'en', { name: x.display || undefined }).name}</span>
                <span className="risk-tech-pct">{percent(fmt, x.probability)}</span>
                {x.impact && <span className="risk-tech-impact">{enumLabel(t, 'results.risk.impact', x.impact)}</span>}
              </li>
            ))}
          />
        )}
      </div>
      )}

      {risk.scored && (
        <Disclosure
          label={t('results.risk.drivers_count', { n: fmt(risk.drivers.length) })}
          region={t('results.risk.drivers')}
          items={risk.drivers.map((d, i) => {
            const ask = pick('risk_driver', d.index) // raw index: unreadable entries before it still count
            return <li key={i} data-focus-selected={ask?.selected || undefined}>{sentence(d)}{ask?.button}</li>
          })}
        />
      )}

      <Disclosure
        label={t('results.risk.caveats')}
        region={t('results.risk.caveats')}
        items={risk.caveats.map((c, i) => {
          const ask = risk.caveats.findIndex((x) => x.id === c.id) === i ? pick('risk_caveat', c.id) : null // equal refs are one element: first occurrence only
          return <li key={c.id} data-focus-selected={ask?.selected || undefined}>{known(`results.risk.caveat.${c.id}`) ? t(`results.risk.caveat.${c.id}`) : c.text}{ask?.button}</li>
        })}
      />
    </section>
  )
}

export function RiskScore({ job }: { job: Job }) {
  const risk = readRisk(job)
  return risk ? <RiskSection risk={risk} /> : null
}

// Risk cell of the metrics bar: percentage + band chip for a scored risk, otherwise an em dash.
export function RiskMetric({ job }: { job: Job }) {
  const t = useT()
  const fmt = useFormat().formatNumber
  const risk = readRisk(job)
  if (!risk?.scored || risk.score === null) return <strong>—</strong>
  const bandKnown = BANDS.includes(risk.band ?? '')
  return (
    <strong className="metrics-risk">
      {percent(fmt, risk.score)}
      <span className="risk-chip" data-band={bandKnown ? risk.band : 'moderate'}>{bandKnown ? t(`results.risk.band.${risk.band}`) : risk.band}</span>
    </strong>
  )
}
