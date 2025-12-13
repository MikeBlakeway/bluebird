export default function StudioProjectPage({ params }: { params: { projectId: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Project: {params.projectId}</h1>

        <div className="bg-card border rounded-lg p-6">
          <p className="text-muted-foreground mb-4">Project studio UI coming in Sprint 2</p>
          <p className="text-sm text-muted-foreground">
            This page will show all takes (compositions) for this project
          </p>
        </div>
      </div>
    </div>
  )
}
