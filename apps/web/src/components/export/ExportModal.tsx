'use client'

import { useCallback, useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Radio,
  RadioGroup,
  Checkbox,
  Card,
  CardBody,
} from '@heroui/react'
import { useExport } from '@/hooks/use-export'
import { JobTimeline } from '@/components/timeline/JobTimeline'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  takeId: string
  planId?: string
}

type ExportFormat = 'wav_48k' | 'wav_441k' | 'mp3'

export function ExportModal({ isOpen, onClose, projectId, takeId, planId }: ExportModalProps) {
  const { isLoading, isComplete, error, jobId, downloadUrls, exportComposition, reset } = useExport(
    {
      projectId,
      takeId,
      planId,
    }
  )

  const [format, setFormat] = useState<ExportFormat>('wav_48k')
  const [includeStems, setIncludeStems] = useState(false)

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [onClose, reset])

  const handleExport = useCallback(async () => {
    const formatConfig: Record<string, { format: 'wav' | 'mp3'; sampleRate: 48000 | 44100 }> = {
      wav_48k: { format: 'wav', sampleRate: 48000 },
      wav_441k: { format: 'wav', sampleRate: 44100 },
      mp3: { format: 'mp3', sampleRate: 48000 },
    }

    const config = formatConfig[format]
    if (!config) throw new Error(`Invalid format: ${format}`)

    await exportComposition({
      format: config.format,
      sampleRate: config.sampleRate,
      includeStems,
    })
  }, [format, includeStems, exportComposition])

  const handleDownload = useCallback((url: string, filename: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }, [])

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" backdrop="blur">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Export Composition</ModalHeader>

        <ModalBody className="space-y-4">
          {/* Format Selection */}
          {!isLoading && !isComplete && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2">Audio Format</label>
                <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                  <Radio value="wav_48k" description="24-bit, 48kHz (highest quality)">
                    WAV 48kHz
                  </Radio>
                  <Radio value="wav_441k" description="24-bit, 44.1kHz (standard CD)">
                    WAV 44.1kHz
                  </Radio>
                  <Radio value="mp3" description="320kbps VBR (smaller file)">
                    MP3 320kbps
                  </Radio>
                </RadioGroup>
              </div>

              {/* Stems Option */}
              <Checkbox
                isSelected={includeStems}
                onValueChange={(checked) => setIncludeStems(checked as boolean)}
                className="py-2"
              >
                Include separated stems (vocals, music, backing)
              </Checkbox>
            </>
          )}

          {/* Job Progress */}
          {isLoading && jobId && (
            <div className="py-4">
              <JobTimeline jobId={jobId} showHeader compact={false} />
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="bg-red-50 border border-red-200">
              <CardBody>
                <p className="text-sm text-red-700">{error.message}</p>
              </CardBody>
            </Card>
          )}

          {/* Download Links */}
          {isComplete && downloadUrls && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-green-700">Export complete!</div>

              {downloadUrls.master && (
                <Button
                  color="success"
                  className="w-full"
                  onClick={() => {
                    if (downloadUrls.master) {
                      handleDownload(
                        downloadUrls.master,
                        `composition-master.${format === 'mp3' ? 'mp3' : 'wav'}`
                      )
                    }
                  }}
                >
                  Download Master
                </Button>
              )}

              {downloadUrls.stems && downloadUrls.stems.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Stems</div>
                  {downloadUrls.stems.map((url, idx) => {
                    const stemNames = ['Vocals', 'Music', 'Backing']
                    return (
                      <Button
                        key={idx}
                        variant="bordered"
                        className="w-full"
                        onClick={() => handleDownload(url, `stem-${stemNames[idx]}.wav`)}
                      >
                        Download {stemNames[idx]}
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button color="default" variant="light" onPress={handleClose}>
            {isComplete ? 'Close' : 'Cancel'}
          </Button>

          {!isLoading && !isComplete && (
            <Button
              color="primary"
              onPress={handleExport}
              disabled={isLoading}
              className="min-w-24"
            >
              Export
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
