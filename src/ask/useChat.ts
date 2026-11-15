import { useEffect, useRef, useState } from 'react'
import { postJobChat } from '../api/client'
import type { ApiError, ChatFocusItem, ChatMessage } from '../api/types'

export const MAX_SENT = 40 // the server accepts 1-40 messages
export const MAX_CHARS = 2000 // code points of a question

// A user turn keeps the focus it was sent with (the shown "About" line, and what Retry resends).
export type Turn = ChatMessage & { focus?: ChatFocusItem[] }

const key = (jobId: string) => `veil.ask.${jobId}`
const valid = (m: unknown): m is ChatMessage =>
  typeof m === 'object' && m !== null && ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant') && typeof (m as ChatMessage).content === 'string'

const isFocus = (f: unknown): f is ChatFocusItem =>
  typeof f === 'object' && f !== null && ['kind', 'ref', 'label'].every((k) => typeof (f as Record<string, unknown>)[k] === 'string')

// Entries stored before focus existed have no `focus` and load as turns without it.
function load(jobId: string): Turn[] {
  try {
    const v: unknown = JSON.parse(sessionStorage.getItem(key(jobId)) ?? '[]')
    if (!Array.isArray(v)) return []
    return v.filter(valid).map((m) => {
      const f: unknown = (m as Turn).focus
      const focus = m.role === 'user' && Array.isArray(f) ? f.filter(isFocus).map(({ kind, ref, label }) => ({ kind, ref, label })) : []
      return { role: m.role, content: m.content, ...(focus.length ? { focus } : {}) }
    })
  } catch {
    return []
  }
}

// The thread of one job: kept in sessionStorage, sent whole (latest MAX_SENT) with every question.
export function useChat(jobId: string, language: string) {
  const [messages, setMessages] = useState(() => load(jobId))
  const [truncated, setTruncated] = useState(false)
  const [pending, setPending] = useState(false)
  // A restored thread that ends with a question means its request never finished.
  const [error, setError] = useState<ApiError | null>(() => (messages.at(-1)?.role === 'user' ? { status: 0, code: 'network_error', message: '' } : null))
  const [conflict, setConflict] = useState<string | null>(null) // job status from a 409 job_not_completed
  const busy = useRef(false)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  useEffect(() => {
    try {
      sessionStorage.setItem(key(jobId), JSON.stringify(messages))
    } catch {
      /* storage full or blocked: the thread lives in memory only */
    }
  }, [jobId, messages])

  const post = async (thread: Turn[]) => {
    const last = thread.at(-1)
    if (busy.current || last?.role !== 'user') return // never start with an assistant message last
    busy.current = true
    setPending(true)
    setError(null)
    const messages = thread.slice(-MAX_SENT).map(({ role, content }) => ({ role, content }))
    const res = await postJobChat(jobId, { messages, language, ...(last.focus?.length ? { focus: last.focus } : {}) })
    busy.current = false
    if (!alive.current) return
    setPending(false)
    const reply = res.ok ? res.data.message : null
    if (res.ok && reply?.role === 'assistant' && typeof reply.content === 'string' && reply.content.trim()) {
      setMessages([...thread, { role: 'assistant', content: reply.content }])
      setTruncated(res.data.history_truncated === true)
    } else if (!res.ok && res.error.code === 'job_not_completed') setConflict(String(res.error.details?.status ?? ''))
    else setError(res.ok ? { status: 200, code: 'invalid_response', message: 'The reply had no message' } : res.error)
  }

  const send = (text: string, focus: ChatFocusItem[] = []) => {
    const content = text.trim()
    if (!content || busy.current) return false
    const thread: Turn[] = [...messages, { role: 'user', content, ...(focus.length ? { focus } : {}) }]
    setMessages(thread)
    void post(thread)
    return true
  }

  return { messages, truncated, pending, error, conflict, send, retry: () => void post(messages) }
}
