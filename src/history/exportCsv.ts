import { listJobs } from '../api/client'
import type { ApiResult, JobSummary } from '../api/types'

export const EXPORT_PAGE = 100
const HEADER = ['id', 'created_at', 'status', 'finalization_status', 'verdict', 'excerpt']

// Pages through the whole list for one (status, q) until next_cursor is null.
export async function fetchAllJobs(status: string | undefined, q: string): Promise<ApiResult<JobSummary[]>> {
  const items: JobSummary[] = []
  let cursor: string | undefined
  do {
    const r = await listJobs({ limit: EXPORT_PAGE, status, q, cursor })
    if (!r.ok) return r
    items.push(...r.data.items)
    cursor = r.data.next_cursor ?? undefined
  } while (cursor)
  return { ok: true, data: items }
}

// A leading = + - @ tab or CR would be run as a formula by spreadsheets; a single quote makes it text. Then RFC 4180 quoting.
function cell(v: unknown): string {
  if (v === null || v === undefined) return ''
  let s = String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(items: JobSummary[]): string {
  const rows = items.map((j) => [j.id, j.created_at, j.status, j.finalization?.status, j.finalization?.verdict, j.excerpt])
  return [HEADER, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n'
}

const pad = (n: number) => String(n).padStart(2, '0')

export function download(csv: string, now = new Date()) {
  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `history-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
