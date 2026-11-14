import type { Coverage } from './worldMapData'

// Mock: there is no coverage data in the backend. Explicit per country; never inferred from article language.
export const EXPLORE_MOCK_COVERAGE: Coverage = {
  FI: { articles: 12, publishers: 4, level: 'high' },
  US: { articles: 18, publishers: 3, level: 'high' },
  GB: { articles: 14, publishers: 3, level: 'high' },
  DE: { articles: 9, publishers: 2, level: 'medium' },
  FR: { articles: 8, publishers: 2, level: 'medium' },
  RU: { articles: 7, publishers: 2, level: 'medium' },
  IN: { articles: 6, publishers: 2, level: 'medium' },
  SE: { articles: 4, publishers: 1, level: 'low' },
  NO: { articles: 3, publishers: 1, level: 'low' },
  EE: { articles: 2, publishers: 1, level: 'low' },
  PL: { articles: 3, publishers: 1, level: 'low' },
  UA: { articles: 5, publishers: 1, level: 'low' },
  TR: { articles: 3, publishers: 1, level: 'low' },
  JP: { articles: 2, publishers: 1, level: 'low' },
  BR: { articles: 4, publishers: 1, level: 'low' },
  ZA: { articles: 2, publishers: 1, level: 'low' },
  AU: { articles: 3, publishers: 1, level: 'low' },
}

export function coverageSummary(coverage: Coverage) {
  const rows = Object.values(coverage)
  if (!rows.length) return 'No verified publisher-country data yet'
  return `${rows.reduce((n, c) => n + c.publishers, 0)} verified publishers across ${rows.length} countries`
}
