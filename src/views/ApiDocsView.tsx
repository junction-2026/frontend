import { useEffect, useState, type ReactNode } from 'react'
import { rich, useT } from '../i18n'

const POST = 'Vote no! They are hiding the truth.'
const COMMENTS = ['Agreed, wake up!', 'Source?']
const BODIES = [
  { key: 'post', body: { post: POST } },
  { key: 'comments', body: { comments: COMMENTS } },
  { key: 'both', body: { post: POST, comments: COMMENTS } },
] as const
const EXAMPLE = {
  id: 'j_123',
  status: 'completed',
  done: true,
  created_at: '2026-11-15T10:00:00Z',
  finished_at: '2026-11-15T10:00:42Z',
  coverage: {},
  input: { content: POST, url: null },
  finalization_status: 'completed',
  result: { verdict: 'detected', confidence: 0.86, user_text: 'This post shows signs of propaganda.', produced_by: 'finalizer' },
  techniques: [{ source: 'classifier', label: 'Doubt', name: 'Doubt', score: 0.71, strength: 'strong', spans: [{ field: 'content', start: 0, end: 5, text: 'Vote ' }] }],
  bot_signal: { label: 'human', score: 0.12, scope: 'text' },
  evidence: { fact_checks: [], news: null, wikipedia: [] },
  error: null,
  share_url: 'https://veil.example.org/jobs/j_123',
}
// [member, i18n key suffix]: a dotted member name is nested in the one above it.
const FIELDS = [
  'id', 'status', 'done', 'created_at', 'finished_at', 'coverage', 'input', 'finalization_status', 'result',
  'result.verdict', 'result.confidence', 'result.user_text', 'result.produced_by', 'techniques', 'bot_signal',
  'evidence', 'evidence.fact_checks', 'evidence.news', 'evidence.wikipedia', 'error', 'share_url',
]
const ERRORS: [number, string][] = [
  [429, 'rate_limited'], [413, 'payload_too_large'], [400, 'invalid_request'], [422, 'validation_failed'],
  [400, 'missing_content'], [503, 'scrape_unavailable'], [404, 'not_found'],
]
// Untranslatable fragments, addressed by the {placeholders} of the catalog strings.
const FRAGMENTS: Record<string, string> = {
  authorization: 'Authorization', jobpath: '/jobs/<id>', content_type: 'Content-Type: application/json', url: 'url', post: 'post',
  comments: 'comments', id: 'id', id_placeholder: '<id>', done: 'done', true: 'true', retry_after: 'Retry-After', null: 'null', empty: '[]',
  status_values: 'queued, running, completed, failed', content: 'content', result: 'result', completed: 'completed',
  verdict_values: 'detected, uncertain, not_detected', uncertain: 'uncertain', score: 'score',
  technique_members: 'source, label, name, score, strength, spans', bot_members: 'label, score, scope',
  evidence_members: 'fact_checks, news, wikipedia', error_members: 'code, message', error_code: 'error.code', details_fields: 'error.details.fields',
}
const CODE = Object.fromEntries(Object.entries(FRAGMENTS).map(([k, v]) => [k, <code dir="ltr">{v}</code>]))

// A code block that is always LTR, with a button that copies its exact text; a missing or rejecting clipboard is ignored.
function CodeBlock({ text }: { text: string }) {
  const t = useT()
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      /* clipboard unavailable or denied: nothing to report */
    }
  }
  return (
    <div className="api-code">
      <button type="button" className="btn-link api-copy" onClick={copy}>{copied ? t('apiDocs.copied') : t('apiDocs.copy')}</button>
      <pre dir="ltr"><code>{text}</code></pre>
    </div>
  )
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="api-section">
    <h2>{title}</h2>
    {children}
  </section>
)

// Public, login-free docs of the public analysis API (public-analysis-api). Static: it calls no endpoint.
export default function ApiDocsView() {
  const t = useT()
  const text = (key: string) => rich(t(`apiDocs.${key}`), CODE)
  const origin = window.location.origin
  const base = `${origin}/api/v1`
  const endpoint = `${base}/public/analyses`
  const create = `curl -s -X POST ${endpoint} -H 'Content-Type: application/json' -d '${JSON.stringify(BODIES[2].body)}'`
  const get = `curl -s ${endpoint}/<id>`
  return (
    <section className="view api-docs">
      <div className="page-head">
        <div className="meta-row"><span>{t('apiDocs.eyebrow')}</span></div>
        <h1>{t('apiDocs.title')}</h1>
        <p>{t('apiDocs.lede')}</p>
      </div>

      <Section title={t('apiDocs.base.title')}>
        <p>{t('apiDocs.base.text')}</p>
        <CodeBlock text={base} />
      </Section>

      <Section title={t('apiDocs.endpoints.title')}>
        <dl className="api-endpoints">
          <dt><code dir="ltr">POST /api/v1/public/analyses</code></dt>
          <dd>{t('apiDocs.endpoints.create')}</dd>
          <dt><code dir="ltr">GET /api/v1/public/analyses/{'{id}'}</code></dt>
          <dd>{t('apiDocs.endpoints.get')}</dd>
        </dl>
      </Section>

      <Section title={t('apiDocs.auth.title')}>
        <p>{text('auth.text')}</p>
      </Section>

      <Section title={t('apiDocs.pipeline.title')}>
        <p>{text('pipeline.text')}</p>
      </Section>

      <Section title={t('apiDocs.request.title')}>
        <p>{text('request.text')}</p>
        {BODIES.map(({ key, body }) => (
          <div key={key}>
            <h3>{t(`apiDocs.request.${key}`)}</h3>
            <CodeBlock text={JSON.stringify(body, null, 2)} />
          </div>
        ))}
        <p>{text('request.notes')}</p>
      </Section>

      <Section title={t('apiDocs.curl.title')}>
        <p>{text('curl.text')}</p>
        <h3>{t('apiDocs.curl.create')}</h3>
        <CodeBlock text={create} />
        <h3>{t('apiDocs.curl.get')}</h3>
        <CodeBlock text={get} />
        <p>{text('curl.poll')}</p>
      </Section>

      <Section title={t('apiDocs.response.title')}>
        <p>{text('response.text')}</p>
        <table className="api-table">
          <thead>
            <tr><th scope="col">{t('apiDocs.fields.member')}</th><th scope="col">{t('apiDocs.fields.meaning')}</th></tr>
          </thead>
          <tbody>
            {FIELDS.map((f) => (
              <tr key={f} className={f.includes('.') ? 'nested' : undefined}>
                <th scope="row"><code dir="ltr">{f}</code></th>
                <td>{text(`field.${f.replace('.', '_')}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>{t('apiDocs.response.example')}</h3>
        <CodeBlock text={JSON.stringify(EXAMPLE, null, 2)} />
      </Section>

      <Section title={t('apiDocs.errors.title')}>
        <p>{text('errors.text')}</p>
        <table className="api-table">
          <thead>
            <tr><th scope="col">{t('apiDocs.errors.status')}</th><th scope="col">{t('apiDocs.errors.code')}</th><th scope="col">{t('apiDocs.errors.meaning')}</th></tr>
          </thead>
          <tbody>
            {ERRORS.map(([status, code]) => (
              <tr key={code}>
                <td><code dir="ltr">{status}</code></td>
                <th scope="row"><code dir="ltr">{code}</code></th>
                <td>{text(`errors.${code}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </section>
  )
}
