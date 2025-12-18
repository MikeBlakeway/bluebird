'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { Button, Card, CardBody, CardFooter, CardHeader } from '@heroui/react'
import { AlertTriangle, Pause, Play, StopCircle } from 'lucide-react'
import { SectionCard, type Section as SectionMeta } from '@/components/SectionCard'
import { JobTimeline } from '@/components/timeline/JobTimeline'
import { useABComparison } from '@/hooks/use-ab-comparison'
import { useAudioEngine } from '@/hooks/use-audio-engine'
import { useJobEvents } from '@/hooks/use-job-events'
import { useRegenSection } from '@/hooks/use-regen-section'
import { useSectionLock } from '@/hooks/use-section-lock'
import { switchTrackVersion } from '@/lib/audio/abSwitch'
import type { PlaybackVersion } from '@/lib/audio-engine'
import type { JobEvent } from '@bluebird/types'

interface TakeEditorClientProps {
  projectId: string
  takeId: string
  planId?: string
}

interface ActiveJob {
  jobId: string
  sectionIdx: number
}

function getTrackId(sectionIdx: number): string {
  return `section-${sectionIdx}`
}

export default function TakeEditorClient({ projectId, takeId, planId }: TakeEditorClientProps) {
  const resolvedPlanId = planId
  const sections = useMemo<SectionMeta[]>(
    () => [
      { name: 'Intro', duration: 24, bpm: 120, hasMusic: true, hasVocals: false },
      { name: 'Verse', duration: 46, bpm: 120, hasMusic: true, hasVocals: true },
      { name: 'Chorus', duration: 38, bpm: 120, hasMusic: true, hasVocals: true },
    ],
    []
  )

  const [versionBAvailability, setVersionBAvailability] = useState<Set<number>>(new Set())
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null)
  const pendingSectionRef = useRef<number | null>(null)

  const { isLocked, toggleLock } = useSectionLock({
    takeId,
    sectionCount: sections.length,
  })

  const { playbackState, currentTime, duration, engine, addTrack, play, pause, stop } =
    useAudioEngine({
      onError: (error) => {
        console.error('AudioEngine error', error)
      },
    })

  const handleEngineVersionSwitch = useCallback(
    async (sectionIdx: number, version: PlaybackVersion) => {
      if (!engine) return

      const trackId = getTrackId(sectionIdx)
      const track = engine.getTrack(trackId)
      if (!track) return

      await switchTrackVersion({ engine, trackId, version })
    },
    [engine]
  )

  const { focusedSectionIdx, setFocusedSectionIdx, getSectionVersion, setSectionVersion } =
    useABComparison({
      sectionCount: sections.length,
      onSwitchVersion: handleEngineVersionSwitch,
    })

  const { regenerateSection, isRegenerating, clearRegenerating } = useRegenSection({
    takeId,
    projectId,
    planId: resolvedPlanId ?? takeId,
    onSuccess: (jobId) => {
      if (pendingSectionRef.current === null) return
      setActiveJob({ jobId, sectionIdx: pendingSectionRef.current })
      pendingSectionRef.current = null
    },
    onError: (error) => {
      console.error('Regeneration failed', error)
      pendingSectionRef.current = null
    },
  })

  const handleJobEvent = useCallback(
    (event: JobEvent) => {
      if (!activeJob) return

      if (event.stage === 'completed') {
        setVersionBAvailability((prev) => new Set(prev).add(activeJob.sectionIdx))
        void setSectionVersion(activeJob.sectionIdx, 'B')
        clearRegenerating()
        setActiveJob(null)
      }

      if (event.stage === 'failed') {
        clearRegenerating()
        setActiveJob(null)
      }
    },
    [activeJob, clearRegenerating, setSectionVersion]
  )

  useJobEvents(activeJob?.jobId ?? null, {
    onEvent: handleJobEvent,
  })

  const handleSelectVersion = useCallback(
    async (sectionIdx: number, version: PlaybackVersion) => {
      await setSectionVersion(sectionIdx, version)
    },
    [setSectionVersion]
  )

  const handleRegenerateSection = useCallback(
    async (sectionIdx: number) => {
      if (!resolvedPlanId) {
        console.error('Cannot regenerate section: Plan ID missing. Add ?planId=... to the URL.')
        return
      }

      pendingSectionRef.current = sectionIdx
      await regenerateSection(sectionIdx)
    },
    [regenerateSection, resolvedPlanId]
  )

  const loadDemoTracks = useCallback(async () => {
    const demoBase = process.env.NEXT_PUBLIC_DEMO_AUDIO_BASE
    if (!demoBase) return

    await Promise.all(
      sections.map(async (section, idx) => {
        const trackId = getTrackId(idx)
        const name = section.name
        const versionAUrl = `${demoBase}/section-${idx}-A.wav`
        const versionBUrl = `${demoBase}/section-${idx}-B.wav`

        await addTrack(trackId, name, versionAUrl, 'A')
        await addTrack(trackId, `${name} (B)`, versionBUrl, 'B')
      })
    )
  }, [addTrack, sections])

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col gap-2">
          <div className="text-sm text-muted-foreground">
            Project: {projectId} / Take: {takeId}
          </div>
          <h1 className="text-2xl font-bold">Take Editor</h1>
          <p className="text-sm text-muted-foreground">
            A/B comparison, section locks, and regeneration controls wired to the WebAudio engine.
          </p>
        </header>

        {!resolvedPlanId && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-100/40 p-4 text-amber-900">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            <div>
              <p className="font-medium">Plan ID required for regeneration</p>
              <p className="text-sm text-amber-900/80">
                Add <code>?planId=&lt;plan-id&gt;</code> to the URL to enable API calls for
                per-section regeneration.
              </p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader className="flex-col items-start gap-2">
            <div className="flex w-full items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Sections</h2>
                <p className="text-sm text-muted-foreground">
                  Focus a card then press A/B to switch versions. Locks persist locally.
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                Focused section: {focusedSectionIdx + 1}
              </div>
            </div>
          </CardHeader>
          <CardBody className="grid gap-4 md:grid-cols-2">
            {sections.map((section, idx) => (
              <SectionCard
                key={section.name}
                sectionIdx={idx}
                section={section}
                isLocked={isLocked(idx)}
                onToggleLock={toggleLock}
                onRegenerate={resolvedPlanId ? handleRegenerateSection : undefined}
                isRegenerating={isRegenerating(idx)}
                canRegenerate={Boolean(resolvedPlanId)}
                activeVersion={getSectionVersion(idx)}
                isVersionBAvailable={versionBAvailability.has(idx)}
                onSelectVersion={handleSelectVersion}
                onFocusSection={setFocusedSectionIdx}
              />
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Preview</h2>
              <p className="text-sm text-muted-foreground">
                Transport is ready. Load demo audio via NEXT_PUBLIC_DEMO_AUDIO_BASE to exercise the
                engine.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="flat" onPress={loadDemoTracks}>
                Load demo
              </Button>
              <Button
                size="sm"
                color="primary"
                startContent={<Play className="h-4 w-4" />}
                onPress={play}
              >
                Play
              </Button>
              <Button
                size="sm"
                variant="flat"
                startContent={<Pause className="h-4 w-4" />}
                onPress={pause}
              >
                Pause
              </Button>
              <Button
                size="sm"
                variant="flat"
                startContent={<StopCircle className="h-4 w-4" />}
                onPress={stop}
              >
                Stop
              </Button>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="font-medium text-foreground">State:</span>
              <span>{playbackState}</span>
              <span className="font-medium text-foreground">Time:</span>
              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="text-xs">Tracks loaded: {engine?.getTracks().length ?? 0}</div>
          </CardBody>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Demo loader expects files at section-0-A.wav / section-0-B.wav etc. under
              NEXT_PUBLIC_DEMO_AUDIO_BASE.
            </p>
          </CardFooter>
        </Card>

        <JobTimeline jobId={activeJob?.jobId ?? null} showHeader compact={false} />
      </div>
    </div>
  )
}
