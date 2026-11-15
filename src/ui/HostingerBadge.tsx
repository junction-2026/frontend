import { rich, useT } from '../i18n'
import emblem from '../assets/hostinger-emblem.svg'

const BRAND = 'Hostinger' // a proper name: never translated, isolated with <bdi> so it keeps its direction in rtl text

// Desktop-only credit; placement, size and visibility live in hosting-badge.css.
export function HostingerBadge() {
  const t = useT()
  return (
    <a className="hosting-badge" href="https://www.hostinger.com" target="_blank" rel="noopener noreferrer">
      <img src={emblem} alt="" aria-hidden="true" width={18} height={18} />
      <span>{rich(t('credits.powered_by'), { brand: <bdi>{BRAND}</bdi> })}</span>
    </a>
  )
}
