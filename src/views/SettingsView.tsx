import { useT } from '../i18n'
import { Link } from '../router'
import { AnalyzersBlock } from '../secondary/AnalyzersBlock'
import { Mock } from '../ui/MockBadge'
import '../secondary/secondary.css'

const TABS = ['interface', 'analyzers', 'accessibility', 'epistemic', 'retention']

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

      <AnalyzersBlock />

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link className="btn-secondary" href="/states">{t('settings.states_link')}</Link>
        <Link className="btn-link" href="/">{t('settings.return')}</Link>
      </div>
    </section>
  )
}
