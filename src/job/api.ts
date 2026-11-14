export type Detection = { name: string; display: string; explanation: string; spans?: unknown; plain_language?: unknown }
export type AnalyzerRun = { name?: string; status?: string; result?: unknown }
export type Job = {
  status: string
  done?: boolean
  input?: { content?: string; source?: { title?: unknown } | null } | null
  analyzers?: AnalyzerRun[]
}

export const POLL_MS = 2000

const TERMINAL = ['completed', 'failed', 'cancelled']
export const isTerminal = (job: Job) => job.done === true || TERMINAL.includes(job.status)

export type JobResult = { ok: true; job: Job } | { ok: false; message: string }

// Never throws: every failure is returned as { ok: false, message }.
export async function fetchJob(id: string, signal?: AbortSignal): Promise<JobResult> {
  try {
    const response = await fetch(`/api/v1/jobs/${encodeURIComponent(id)}`, {
      headers: { Accept: 'application/json' },
      signal,
    })
    if (response.status === 404) return { ok: false, message: `Job ${id} was not found.` }
    if (!response.ok) return { ok: false, message: `Could not load the job: HTTP ${response.status}` }
    const job: unknown = await response.json()
    if (typeof job !== 'object' || job === null || typeof (job as Job).status !== 'string')
      return { ok: false, message: 'Could not load the job: unexpected response.' }
    return { ok: true, job: job as Job }
  } catch (error) {
    return { ok: false, message: `Could not load the job: ${error instanceof Error ? error.message : String(error)}` }
  }
}
