import { useId, type Ref } from 'react'
import { useFormat, useT } from '../i18n'
import { MAX_FOCUS, type FocusEntry, type FocusGroup } from './focusItems'

type Props = {
  items: FocusEntry[]
  selected: ReadonlySet<string>
  completed: boolean // job status is completed
  disabled: boolean // composer is off
  headingRef: Ref<HTMLHeadingElement>
  onToggle: (key: string) => void
  onClear: () => void
}

// The job's result elements as checkboxes; the chosen ones focus the next questions.
export function FocusPanel({ items, selected, completed, disabled, headingRef, onToggle, onClear }: Props) {
  const t = useT()
  const { formatNumber } = useFormat()
  const heading = useId()
  const full = selected.size >= MAX_FOCUS
  const groups = items.reduce<{ group: FocusGroup; items: FocusEntry[] }[]>((acc, it) => {
    if (acc.at(-1)?.group === it.group) acc.at(-1)!.items.push(it)
    else acc.push({ group: it.group, items: [it] })
    return acc
  }, [])
  return (
    <section className="card focus-panel" role="region" aria-label={t('ask.focus.region')}>
      <h2 id={heading} ref={headingRef} tabIndex={-1}>{t('ask.focus.title')}</h2>
      {!completed || items.length === 0 ? (
        <p className="chat-note" role="note">{t(completed ? 'ask.focus.empty' : 'ask.focus.not_completed')}</p>
      ) : (
        <>
          <p className="chat-note">{t('ask.focus.help')}</p>
          <p className="chat-note" role="status" aria-live="polite">{full && t('ask.focus.limit', { max: formatNumber(MAX_FOCUS) })}</p>
          {selected.size > 0 && <button type="button" className="btn-secondary focus-clear" onClick={onClear} disabled={disabled}>{t('ask.focus.clear')}</button>}
          {groups.map((g) => (
            <fieldset key={g.group} className="focus-group">
              <legend>{t(`ask.focus.group.${g.group}`)}</legend>
              <ul>
                {g.items.map((it) => (
                  <li key={it.key} className={it.child ? 'focus-child' : undefined}>
                    <label className="focus-item">
                      <input type="checkbox" checked={selected.has(it.key)} disabled={disabled || (full && !selected.has(it.key))} onChange={() => onToggle(it.key)} />
                      <span dir="auto">{it.shown}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          ))}
        </>
      )}
    </section>
  )
}
