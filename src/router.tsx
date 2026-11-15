import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react'

export type RouteName =
  | 'home' | 'analyzing' | 'results' | 'history' | 'explore' | 'region' | 'ask' | 'states' | 'api-docs'
export type Route = { name: RouteName; id?: string }

// Ordered table; the first match wins and an unknown path falls back to Home.
const ROUTES: [RegExp, RouteName][] = [
  [/^\/$/, 'home'],
  [/^\/jobs\/([^/]+)\/live$/, 'analyzing'],
  [/^\/jobs\/([^/]+)\/ask$/, 'ask'],
  [/^\/jobs\/([^/]+)$/, 'results'],
  [/^\/history$/, 'history'],
  [/^\/explore$/, 'explore'],
  [/^\/explore\/region$/, 'region'],
  [/^\/ask$/, 'ask'],
  [/^\/states$/, 'states'],
  [/^\/docs\/api$/, 'api-docs'],
]

// `?job=<id>` of /explore: URL-decoded; a malformed escape or an empty value counts as absent.
function exploreJob(search: string): string | undefined {
  const raw = /[?&]job=([^&]*)/.exec(search)?.[1]
  if (!raw) return undefined
  try {
    return decodeURIComponent(raw)
  } catch {
    return undefined
  }
}

export function matchRoute(pathname: string, search = ''): Route {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  for (const [re, name] of ROUTES) {
    const m = re.exec(path)
    if (!m) continue
    if (name === 'explore') return { name, id: exploreJob(search) }
    if (m[1] === undefined) return { name }
    try {
      return { name, id: decodeURIComponent(m[1]) }
    } catch {
      return { name: 'home' } // malformed %-escape in the id
    }
  }
  return { name: 'home' }
}

// Which primary nav tab a route belongs to (null: none).
export function navFor(name: RouteName): 'analyze' | 'explore' | 'history' | null {
  if (name === 'explore' || name === 'region') return 'explore'
  if (name === 'history') return 'history'
  if (name === 'api-docs') return null
  return 'analyze'
}

// Old links become their current URL, without a reload: `/?job=<id>` -> `/jobs/<id>` and
// `/jobs/<id>/detail[/]` -> `/jobs/<id>` (raw id segment and query kept).
function redirectLegacy() {
  const { pathname, search } = window.location
  const job = pathname === '/' ? new URLSearchParams(search).get('job') : null
  if (job) return window.history.replaceState(null, '', `/jobs/${encodeURIComponent(job)}`)
  const detail = /^\/jobs\/([^/]+)\/detail\/*$/.exec(pathname)
  if (detail) window.history.replaceState(null, '', `/jobs/${detail[1]}${search}`)
}

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

// Back/Forward to an old entry is redirected before the route is read.
const onPop = () => redirectLegacy()

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener('popstate', onPop)
  window.addEventListener('popstate', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('popstate', onPop)
    window.removeEventListener('popstate', listener)
  }
}

export function navigate(to: string) {
  window.history.pushState(null, '', to)
  redirectLegacy()
  notify()
  window.scrollTo(0, 0)
}

export function useRoute(): Route {
  const url = useSyncExternalStore(subscribe, () => window.location.pathname + window.location.search)
  const q = url.indexOf('?')
  return q < 0 ? matchRoute(url) : matchRoute(url.slice(0, q), url.slice(q))
}

// Runs once before the first render (see App).
export const initRouter = redirectLegacy

export function Link({ href, onClick, target, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || target) return
    e.preventDefault()
    navigate(href)
  }
  return <a href={href} target={target} onClick={handle} {...rest} />
}
