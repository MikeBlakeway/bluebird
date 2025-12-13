export default function NewWorkspacePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">New Composition</h1>
        
        <div className="bg-card border rounded-lg p-6">
          <p className="text-muted-foreground mb-4">
            Workspace UI coming in Task 2.6 (Lyrics Input & Controls)
          </p>
          <p className="text-sm text-muted-foreground">
            For now, use the CLI: <code className="bg-muted px-2 py-1 rounded">pnpm --filter @bluebird/api cli plan --lyrics "Your lyrics here"</code>
          </p>
        </div>
      </div>
    </div>
  )
}
