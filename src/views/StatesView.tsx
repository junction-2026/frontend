import { Link } from '../router'
import { Mock } from '../ui/MockBadge'
import '../secondary/secondary.css'

// Static showcase of the four edge cases; the real states render on the results, analyzing and history views.
export default function StatesView() {
  return (
    <section className="view">
      <Mock block label="Example states">
        <div className="page-head">
          <div className="meta-row"><span>● System integrity &amp; resilience</span></div>
          <h1>Edge Cases &amp; System States</h1>
          <p>Calm, graceful degradation patterns for input errors, partial scraping timeouts, and epistemic uncertainty.</p>
        </div>

        <div className="edge-grid">
          <article className="card edge-card">
            <div className="edge-card-top">
              <div className="edge-icon warn" aria-hidden="true">⛓</div>
              <span className="status-pill orange">Input Fault · 403</span>
            </div>
            <h3>Unable to retrieve social post</h3>
            <p>The scraper could not access the linked timeline. The target may be protected, deleted, or region-blocked.</p>
            <div className="fault-box">
              <div>x.com/status/1849201…</div>
              <div className="err">⚠ Protected tweet timeline or deleted target</div>
            </div>
            <div className="remedy-box">
              <strong>Suggested Remedy</strong>
              <div style={{ marginTop: '0.35rem', color: 'var(--muted)' }}>Paste the post text manually, or switch input mode to Text.</div>
            </div>
            <div className="edge-actions">
              <Link className="btn-link" href="/">Switch to Text Input →</Link>
              <span className="edge-meta">Auto-cleared</span>
            </div>
          </article>

          <article className="card edge-card">
            <div className="edge-card-top">
              <span className="status-pill orange">● Partial Results Preserved · 6 of 8 Analyzers Succeeded</span>
              <span className="edge-note">Latency 3042ms</span>
            </div>
            <h3>Wire cross-referencing timed out</h3>
            <p>Analysis Pipeline Integrity · 75% Available</p>
            <div className="bar" style={{ maxWidth: 'none', margin: '0 0 0.7rem' }}><span style={{ width: '75%' }} /></div>
            <div className="pipeline-grid">
              <div>✓ Linguistic Syntax</div>
              <div>✓ Persuasion Vectors</div>
              <div>✓ Claim Extraction</div>
              <div className="skip">⊘ AP / Reuters Wire (Timeout)</div>
            </div>
            <div className="info-box">Verdict is available. Wire evidence was skipped for this run and can be retried independently.</div>
            <div className="edge-actions">
              <Link className="btn-primary" href="/history">View Available Verdict →</Link>
              <Mock label="Retry is not available">
                <button type="button" className="btn-secondary" disabled>↻ Retry Wire Retrieval</button>
              </Mock>
            </div>
          </article>

          <article className="card edge-card">
            <div className="edge-card-top">
              <span className="status-pill purple">● Uncertain / Insufficient Context</span>
              <span className="edge-note">Model Entropy: 0.88</span>
            </div>
            <h3>No definitive manipulation markers detected</h3>
            <p>Signal strength is below decision threshold. The text may be incomplete, ironic, or too short for stable classification.</p>
            <div className="info-box">Ask VEIL can still help unpack ambiguity, or you can submit a longer excerpt.</div>
            <div className="edge-actions">
              <Link className="btn-secondary" href="/ask">Open Ask VEIL</Link>
              <Link className="btn-link" href="/">Submit more context →</Link>
            </div>
          </article>

          <article className="card edge-card">
            <div className="edge-card-top">
              <div className="edge-icon ok" aria-hidden="true">☰</div>
              <span className="status-pill green">Session Fresh</span>
            </div>
            <h3>No previous analyses yet</h3>
            <p>Your local ledger is empty. Completed jobs will appear under History with reopen and export controls.</p>
            <div className="edge-actions">
              <Link className="btn-primary" href="/">Start first analysis</Link>
              <Link className="btn-link" href="/history">Open History →</Link>
            </div>
          </article>
        </div>
      </Mock>
    </section>
  )
}
