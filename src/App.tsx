import { useState, type ComponentType } from 'react'
import { I18nProvider } from './i18n'
import { initRouter, useRoute, type RouteName } from './router'
import { Shell } from './ui/Shell'
import AnalyzingView from './views/AnalyzingView'
import AskView from './views/AskView'
import DetailView from './views/DetailView'
import ExploreView from './views/ExploreView'
import HistoryView from './views/HistoryView'
import HomeView from './views/HomeView'
import RegionView from './views/RegionView'
import ResultsView from './views/ResultsView'
import StatesView from './views/StatesView'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/shell.css'
import './styles/components.css'
import './styles/hosting-badge.css'

type ViewProps = { id: string }
// Job routes always carry an id; the others ignore it.
const VIEWS: Record<RouteName, ComponentType<ViewProps>> = {
  home: HomeView, analyzing: AnalyzingView, results: ResultsView, detail: DetailView, history: HistoryView,
  explore: ExploreView, region: RegionView, ask: AskView, states: StatesView,
}

export default function App() {
  useState(initRouter) // legacy /?job=<id> redirect before the first route is read
  const route = useRoute()
  const View = VIEWS[route.name]
  return (
    <I18nProvider>
      <Shell>
        <View id={route.id ?? ''} />
      </Shell>
    </I18nProvider>
  )
}
