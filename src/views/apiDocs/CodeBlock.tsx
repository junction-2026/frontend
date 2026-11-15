import { useEffect, useState, type ReactNode } from 'react'
import { useT } from '../../i18n'

// A code block that is always LTR, with a button that copies its exact text; a missing or rejecting clipboard is ignored.
// children, when given, are the same text rendered with markup (syntax highlighting).
export default function CodeBlock({ text, label, children }: { text: string; label: string; children?: ReactNode }) {
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
      <button type="button" className="btn-link api-copy" aria-label={`${copied ? t('apiDocs.copied') : t('apiDocs.copy')}: ${label}`} onClick={copy}>{copied ? t('apiDocs.copied') : t('apiDocs.copy')}</button>
      <pre dir="ltr"><code>{children ?? text}</code></pre>
    </div>
  )
}
