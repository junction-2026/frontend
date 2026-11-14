import { useEffect, useState } from 'react'
import { checkHealth, type HealthResult } from './health'

export default function App() {
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
