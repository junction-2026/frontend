import { useT } from '../i18n'
import { Link } from '../router'
import { AnalyzersBlock } from '../secondary/AnalyzersBlock'
import { Mock } from '../ui/MockBadge'
import '../secondary/secondary.css'

const TABS = ['interface', 'analyzers', 'accessibility', 'epistemic', 'retention']

// Non-functional switch (the mock's toggle): shown on, cannot be changed.
const Switch = ({ label }: { label: string }) => <span className="toggle" role="switch" aria-checked="true" aria-disabled="true" aria-label={label} />

export default function SettingsView() {
  const t = useT()
  return (
    <section className="view">
      <div className="page-head">
        <div className="meta-row"><span>{t('settings.eyebrow')}</span></div>
        <h1>{t('settings.title')}</h1>
        <p>{t('settings.lede')}</p>
      </div>

      <Mock block label={t('settings.tabs_label')}>
        <div className="settings-tabs">
          {TABS.map((k, i) => <button type="button" key={k} className={i === 0 ? 'active' : undefined}>{t(`settings.tab.${k}`)}</button>)}
        </div>
      </Mock>

      <Mock block label={t('settings.language_block')}>
        <section className="card settings-block" style={{ marginBottom: 0 }}>
          <div className="settings-block-head">
            <span>{t('settings.language_block')}</span>
            <span>{t('settings.local_override')}</span>
          </div>
          <div className="setting-row">
            <div>
              <h4>{t('settings.interface_language')}</h4>
              <p>{t('settings.interface_language_text')}</p>
            </div>
            <div className="select-fake">{t('settings.interface_language_value')}</div>
          </div>
          <div className="setting-row">
            <div>
              <h4>{t('settings.input_language')} <span className="badge-blue">{t('settings.recommended')}</span></h4>
              <p>{t('settings.input_language_text')}</p>
            </div>
            <Switch label={t('settings.input_language_switch')} />
          </div>
        </section>
      </Mock>

      <AnalyzersBlock />

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link className="btn-secondary" href="/states">{t('settings.states_link')}</Link>
        <Link className="btn-link" href="/">{t('settings.return')}</Link>
      </div>
    </section>
  )
}
