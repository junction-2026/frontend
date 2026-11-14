import { useState, type FormEvent } from 'react'
import { Link } from '../router'
import { Mock } from '../ui/MockBadge'
import '../secondary/secondary.css'

const LABEL = 'No backend for Ask VEIL'
const SUGGESTIONS = ['What other techniques were detected?', 'What evidence contradicts this claim?']

// Mock: the thread is canned and sending only appends a local bubble; nothing is sent to the backend.
export default function AskView() {
  const [draft, setDraft] = useState('')
  const [sent, setSent] = useState<string[]>([])

  const send = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setSent((s) => [...s, text])
    setDraft('')
  }

  return (
    <section className="view">
      <Mock block label={LABEL}>
        <div className="context-bar">
          <div className="left">
            <span className="status-pill orange">● Manipulation detected (94% confidence)</span>
            <h3>Source item: “Everyone knows these people are destroying our future...”</h3>
            <p>This text uses emotionally charged language, unspecified outgroup s...</p>
          </div>
          <Link className="btn-secondary" href="/history">← Back to summary</Link>
        </div>
      </Mock>

      <div className="card chat-card">
        <div className="chat-head">
          <h1>Ask VEIL <span className="badge-blue">Interactive Intelligence</span></h1>
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Grounded in submitted text, wire reports &amp; fact-checks</span>
        </div>
        <p className="chat-prompt">Have a question about this source, rhetorical indicators, or corroborating reporting?</p>

        <Mock block label={LABEL}>
          <div className="chat-thread" role="log" aria-label="Conversation">
            <div className="bubble-user">Why was this flagged as Appeal to Fear?</div>
            <div className="bubble-ai">
              <div className="avatar-sm">V</div>
              <div className="content">
                <p>The span “destroying our future… before it’s too late” matches catastrophizing + urgency patterns at a <strong>96% pattern match</strong> against the fear-appeal catalog.</p>
                <div className="meta-chips">
                  <span>{'{ }'} Corpus ref: #CAT-FEAR-449</span>
                  <span>Weight: High (+0.42)</span>
                </div>
              </div>
            </div>
            <div className="bubble-user">How do other verified news sources cover this demographic?</div>
            <div className="bubble-ai">
              <div className="avatar-sm">V</div>
              <div className="content">
                <p><strong>Financial Times</strong> and <strong>Reuters</strong> frame the same theme around grid resilience and attribution caution, without outgroup blame language.</p>
                <div className="ref-cards">
                  <Link className="ref-card" href="/explore">View 6 Related Wire Articles <span>↗</span></Link>
                  <button type="button" className="ref-card">Reuters Fact-Check File <span>↗</span></button>
                </div>
              </div>
            </div>
            {sent.map((text, i) => <div className="bubble-user" key={i}>{text}</div>)}
          </div>
        </Mock>

        <Mock block label={LABEL}>
          <div className="suggestions">
            {SUGGESTIONS.map((s) => <button type="button" key={s} onClick={() => setDraft(s)}>{s}</button>)}
            <Link className="accent" href="/explore">Explore coverage of this topic on World Map →</Link>
          </div>
        </Mock>

        <Mock block label={LABEL}>
          <form className="chat-input" onSubmit={send}>
            <input aria-label="Message" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask anything about this source, rhetorical markers, or wire context..." />
            <button className="send-btn" type="submit" aria-label="Send">↑</button>
          </form>
        </Mock>
      </div>
    </section>
  )
}
