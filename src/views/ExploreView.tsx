import { ExploreEmpty, ExploreJob } from '../explore/Explore'

// `/explore?job=<id>`; the id comes from the router, without it nothing is requested.
export default function ExploreView({ id }: { id?: string }) {
  return id ? <ExploreJob id={id} /> : <ExploreEmpty />
}
