import type { ReactNode } from 'react'
import { errorMessage } from '../api/errors'
import type { ApiError, Job } from '../api/types'
import { useJob } from './useJob'

export function Skeleton() {
  return (
    <div role="status" aria-label="Loading" className="skeleton">
      <span className="skeleton-line" />
      <span className="skeleton-line" />
      <span className="skeleton-line short" />
    </div>
  )
}

// 404 gets its own copy; every other envelope goes through the foundation mapping.
export function ErrorAlert({ error, notFound }: { error: ApiError; notFound?: string }) {
  return <p role="alert" className="state-error">{error.status === 404 && notFound ? notFound : errorMessage(error)}</p>
}

// Loads (and polls) a job; shows the skeleton, the error alert or the render prop.
export function WithJob({ id, children }: { id: string; children: (job: Job) => ReactNode }) {
  const result = useJob(id)
  if (!result) return <Skeleton />
  if (!result.ok) return <ErrorAlert error={result.error} notFound="Job not found" />
  return <>{children(result.data)}</>
}
