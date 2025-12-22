import TakeEditorClient from './take-editor-client'

interface PageProps {
  params: Promise<{ projectId: string; takeId: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function TakeEditorPage({ params, searchParams }: PageProps) {
  const { projectId, takeId } = await params
  const resolvedSearchParams = await searchParams
  const planId =
    typeof resolvedSearchParams?.planId === 'string' ? resolvedSearchParams.planId : undefined

  return <TakeEditorClient projectId={projectId} takeId={takeId} planId={planId} />
}
