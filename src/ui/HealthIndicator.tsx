import { useEffect, useState } from 'react'
import { checkHealth, type HealthResult } from '../health'

export function HealthIndicator() {
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

  if (!result)
    return (
      <span className="health" role="status">
        <span className="dot" /> Checking backend…
      </span>
    )
  if (!result.ok)
    return (
      <span className="health offline" role="alert" title={result.message}>
        <span className="dot" /> Backend offline
      </span>
    )
  return (
    <span className="health online">
      <span className="dot" /> Backend online
    </span>
  )
}
