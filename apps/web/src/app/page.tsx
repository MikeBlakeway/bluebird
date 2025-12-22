import Link from 'next/link'
import { Button, Card, CardHeader, CardBody } from '@heroui/react'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6">Create Original Music with AI</h1>
        <p className="text-xl text-default-500 mb-8">
          Paste your lyrics, choose your vibe, and let Bluebird compose original melodies,
          harmonies, and arrangements in under 45 seconds.
        </p>
        <div className="flex gap-4 justify-center">
          <Button as={Link} href="/studio/new" color="primary" size="lg">
            Start Creating
          </Button>
          <Button as={Link} href="#how-it-works" variant="bordered" size="lg">
            Learn More
          </Button>
        </div>
      </div>

      <div className="mt-24 max-w-5xl mx-auto" id="how-it-works">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="w-full">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">📝</span>
                </div>
                <h3 className="text-xl font-semibold">1. Paste Lyrics</h3>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-default-500">
                Enter your original lyrics or use our examples. Choose your genre and AI vocalist.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-full">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">🎵</span>
                </div>
                <h3 className="text-xl font-semibold">2. AI Composes</h3>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-default-500">
                Our engine generates original melody, harmony, arrangement, and vocals in ~45
                seconds.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-full">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">🎧</span>
                </div>
                <h3 className="text-xl font-semibold">3. Refine & Export</h3>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-default-500">
                Regenerate sections, adjust the mix, and export professional stems or a final
                master.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      <Card className="mt-24 max-w-3xl mx-auto">
        <CardHeader>
          <h3 className="text-2xl font-semibold">100% Original Music</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-default-500">
            Every composition is created from scratch using AI. We don't sample existing songs or
            clone celebrity voices. All melodies are checked for similarity to ensure your music is
            safe to use commercially.
          </p>
          <p className="text-sm text-default-500">
            Reference audio (≤30s) can guide the vibe, but we extract features only—no raw audio
            reuse.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
