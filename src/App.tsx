import { useEffect, useState } from 'react'
import { checkHealth, type HealthResult } from './health'
import JobView from './job/JobView'

export default function App() {
  const job = new URLSearchParams(window.location.search).get('job')
  return job ? <JobView id={job} /> : <HealthPage />
}

function HealthPage() {
  const [result, setResult] = useState<HealthResult | null>(null)

  useEffect(() => {
    let active = true
    void checkHealth().then((r) => {
      if (active) setResult(r)
    })
    return () => {
      active = false
    }
  }, [])

  if (!result) return <p role="status">Loading…</p>
  if (!result.ok) return <p role="alert">{result.message}</p>
  return <h1>Hello, World!</h1>
}
