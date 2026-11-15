import { createContext, useContext, type ReactNode } from 'react'
import { useT } from '../i18n'
import type { FocusEntry } from '../ask/focusItems'

// Optional "ask about this element" mode of the result components. Only the Ask page provides it, so /jobs/:id renders no toggles.
export type FocusSelection = {
  entries: ReadonlyMap<string, FocusEntry> // the elements focusItemsOf lists, by `kind:ref`
  selected: ReadonlySet<string>
  full: boolean // the limit is reached: unselected toggles are off
  disabled: boolean // the composer is off
  toggle: (key: string) => void
}

const Selection = createContext<FocusSelection | null>(null)
export const FocusSelectionProvider = Selection.Provider
export const useFocusSelection = () => useContext(Selection)

type Pick = { selected: boolean; button: ReactNode }

// `pick(kind, ref)` gives the selected state (for the section's style) and the toggle button of one element, or null when
// there is no provider or focusItemsOf does not list the element (e.g. a blank label). Refs address the raw job arrays.
export function useFocusPick(): (kind: string, ref: string | number) => Pick | null {
  const sel = useFocusSelection()
  const t = useT()
  return (kind, ref) => {
    const entry = sel?.entries.get(`${kind}:${ref}`)
    if (!sel || !entry) return null
    const on = sel.selected.has(entry.key)
    const name = t('ask.focus.select', { label: entry.shown })
    return {
      selected: on,
      button: (
        <button
          type="button" className="focus-select" aria-pressed={on} aria-label={name} title={name}
          disabled={sel.disabled || (sel.full && !on)} onClick={() => sel.toggle(entry.key)}
        >
          <span aria-hidden="true">{on ? '✓' : '+'}</span>
        </button>
      ),
    }
  }
}
