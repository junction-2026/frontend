import { Link } from '../router'
import { AnalyzersBlock } from '../secondary/AnalyzersBlock'
import { Mock } from '../ui/MockBadge'
import '../secondary/secondary.css'

const TABS = ['Interface & Language', 'Analyzers & Ensembles', 'Accessibility', 'Epistemic Framework', 'Data Retention']

// Non-functional switch (the mock's toggle): shown on, cannot be changed.
const Switch = ({ label }: { label: string }) => <span className="toggle" role="switch" aria-checked="true" aria-disabled="true" aria-label={label} />

export default function SettingsView() {
  return (
    <section className="view">
      <div className="page-head">
        <div className="meta-row"><span>Preferences &amp; audit / ● Framework v3.18</span></div>
        <h1>Settings &amp; Methodology</h1>
        <p>Configure analysis preferences, accessibility options, and understand VEIL’s epistemic framework.</p>
      </div>

      <Mock block label="Settings tabs">
        <div className="settings-tabs">
          {TABS.map((t, i) => <button type="button" key={t} className={i === 0 ? 'active' : undefined}>{t}</button>)}
        </div>
      </Mock>

      <Mock block label="Interface & analysis language">
        <section className="card settings-block" style={{ marginBottom: 0 }}>
          <div className="settings-block-head">
            <span>Interface &amp; analysis language</span>
            <span>Local override</span>
          </div>
          <div className="setting-row">
            <div>
              <h4>Interface Language</h4>
              <p>Controls labels, helper text, and Ask VEIL responses in the product chrome.</p>
            </div>
            <div className="select-fake">English (US) ▾</div>
          </div>
          <div className="setting-row">
            <div>
              <h4>Analysis Input Language <span className="badge-blue">Recommended</span></h4>
              <p>Auto-detect input language and translate intermediate tokens before English-only ensemble stages.</p>
            </div>
            <Switch label="Analysis input language" />
          </div>
        </section>
      </Mock>

      <AnalyzersBlock />

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link className="btn-secondary" href="/states">View edge-case states →</Link>
        <Link className="btn-link" href="/">Return to Analyze</Link>
      </div>
    </section>
  )
}
