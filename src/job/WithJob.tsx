import type { ReactNode } from 'react'
import { errorMessage } from '../api/errors'
import type { ApiError, Job } from '../api/types'
import { useT } from '../i18n'
import { useJob } from './useJob'

export function Skeleton() {
  const t = useT()
  return (
    <div role="status" aria-label={t('results.loading')} className="skeleton">
      <span className="skeleton-line" />
      <span className="skeleton-line" />
      <span className="skeleton-line short" />
    </div>
  )
}

// 404 gets its own copy; every other envelope goes through the foundation mapping.
export function ErrorAlert({ error, notFound }: { error: ApiError; notFound?: string }) {
  useT() // re-render on a language switch: errorMessage reads the active locale
  return <p role="alert" className="state-error">{error.status === 404 && notFound ? notFound : errorMessage(error)}</p>
}

// Loads (and polls) a job; shows the skeleton, the error alert or the render prop.
export function WithJob({ id, children }: { id: string; children: (job: Job) => ReactNode }) {
  const t = useT()
  const result = useJob(id)
  if (!result) return <Skeleton />
  if (!result.ok) return <ErrorAlert error={result.error} notFound={t('results.job_not_found')} />
  return <>{children(result.data)}</>
}
