import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6">Create Original Music with AI</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Paste your lyrics, choose your vibe, and let Bluebird compose original melodies,
          harmonies, and arrangements in under 45 seconds.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/studio/new">Start Creating</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="#how-it-works">Learn More</Link>
          </Button>
        </div>
      </div>

      <div className="mt-24 max-w-5xl mx-auto" id="how-it-works">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">📝</span>
              </div>
              <CardTitle>1. Paste Lyrics</CardTitle>
              <CardDescription>
                Enter your original lyrics or use our examples. Choose your genre and AI vocalist.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🎵</span>
              </div>
              <CardTitle>2. AI Composes</CardTitle>
              <CardDescription>
                Our engine generates original melody, harmony, arrangement, and vocals in ~45
                seconds.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🎧</span>
              </div>
              <CardTitle>3. Refine & Export</CardTitle>
              <CardDescription>
                Regenerate sections, adjust the mix, and export professional stems or a final
                master.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      <Card className="mt-24 max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>100% Original Music</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Every composition is created from scratch using AI. We don't sample existing songs or
            clone celebrity voices. All melodies are checked for similarity to ensure your music is
            safe to use commercially.
          </p>
          <p className="text-sm text-muted-foreground">
            Reference audio (≤30s) can guide the vibe, but we extract features only—no raw audio
            reuse.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
