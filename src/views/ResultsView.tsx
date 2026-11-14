import JobView from '../job/JobView'

// Stub: the screen task replaces this file; until then the existing job result view is shown.
export default function ResultsView({ id }: { id: string }) {
  return (
    <section className="view">
      <h1 className="sr-only">Results</h1>
      <JobView id={id} />
    </section>
  )
}
