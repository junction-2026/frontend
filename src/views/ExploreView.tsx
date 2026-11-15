import { ExploreJob } from '../explore/Explore'
import PropagandaMap from '../explore/propagandaMap/PropagandaMap'
import { ExploreVeil } from '../ui/ExploreVeil'

// `/explore?job=<id>`: that job's coverage. Without a job: the global propaganda map. The router supplies the id.
// The veil is a sibling before `.view`, not inside it: `.view`'s rise transform would capture the fixed layer.
export default function ExploreView({ id }: { id?: string }) {
  return (
    <>
      <ExploreVeil />
      {id ? <ExploreJob id={id} /> : <PropagandaMap />}
    </>
  )
}
