import type { Job } from '../api/types'
import { useState } from 'react'
import { useLocale, useT } from '../i18n'
import { Link } from '../router'
import { Coverage } from './Coverage'
import { DetailedAnalysis } from './DetailedAnalysis'
import { techniqueInfo, readTechniques } from './read'
import './results.css'

const EXCERPT_MAX = 400

const TAG_TONES = ['orange', 'pink', 'purple']

// Everything below the verdict. /jobs/:id shows it behind a toggle (and passes the toggle's `id`); the Ask page shows it always.
export function ResultDetail({ job, id }: { job: Job; id?: string }) {
  const t = useT()
  const { locale } = useLocale()
  const [copied, setCopied] = useState(false)
  const content = typeof job.input?.content === 'string' ? job.input.content : ''
  const read = readTechniques(job)
  const techniques = read?.detected ?? []
  const copy = () => navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true), () => undefined)
  return (
    <div id={id} role="region" aria-label={t('results.detailed_region')} className="detailed-region">
      {content && (
        <div className="soft-card results-excerpt">
          <p className="quote-text">“<bdi dir="auto">{content.length > EXCERPT_MAX ? `${content.slice(0, EXCERPT_MAX)}…` : content}</bdi>”</p>
        </div>
      )}
      <div className="card detailed-summary">
        {techniques.length > 0 && (
          <div className="tags">
            {techniques.map((d, i) => (
              <span key={d.name} className={`tag ${TAG_TONES[i % TAG_TONES.length]}`}>{techniqueInfo(d, locale, read?.lang).name}</span>
            ))}
          </div>
        )}
        <div className="verdict-actions">
          <Link className="btn-link" href={`/explore?job=${encodeURIComponent(job.id)}`}>{t('results.explore')}</Link>
          <span className="spacer" />
          <button type="button" className="icon-btn" aria-label={copied ? t('results.copied') : t('results.copy')} title={t('results.copy_title')} onClick={() => void copy()}>
            {copied ? '✓' : '⧉'}
          </button>
        </div>
      </div>
      <DetailedAnalysis job={job} />
      <Coverage job={job} />
    </div>
  )
}
