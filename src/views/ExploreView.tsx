import { ExploreJob } from '../explore/Explore'
import PropagandaMap from '../explore/propagandaMap/PropagandaMap'

// `/explore?job=<id>`: that job's coverage. Without a job: the global propaganda map. The router supplies the id.
export default function ExploreView({ id }: { id?: string }) {
  return id ? <ExploreJob id={id} /> : <PropagandaMap />
}
