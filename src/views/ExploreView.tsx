import { ExploreJob } from '../explore/Explore'
import PropagandaMap from '../explore/propagandaMap/PropagandaMap'

// `/explore?job=<id>`: that job's coverage. Without a job: the global propaganda map. The router supplies the id.
// No backdrop layer: the page shows the body's solid var(--bg).
export default function ExploreView({ id }: { id?: string }) {
  return id ? <ExploreJob id={id} /> : <PropagandaMap />
}
