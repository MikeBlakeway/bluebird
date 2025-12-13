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
          <a
            href="/studio/new"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2"
          >
            Start Creating
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-6 py-2"
          >
            Learn More
          </a>
        </div>
      </div>

      <div className="mt-24 max-w-5xl mx-auto" id="how-it-works">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📝</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">1. Paste Lyrics</h3>
            <p className="text-muted-foreground">
              Enter your original lyrics or use our examples. Choose your genre and AI vocalist.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎵</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">2. AI Composes</h3>
            <p className="text-muted-foreground">
              Our engine generates original melody, harmony, arrangement, and vocals in ~45 seconds.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎧</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">3. Refine & Export</h3>
            <p className="text-muted-foreground">
              Regenerate sections, adjust the mix, and export professional stems or a final master.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-24 max-w-3xl mx-auto bg-muted/50 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">100% Original Music</h2>
        <p className="text-muted-foreground mb-4">
          Every composition is created from scratch using AI. We don't sample existing songs or
          clone celebrity voices. All melodies are checked for similarity to ensure your music is
          safe to use commercially.
        </p>
        <p className="text-sm text-muted-foreground">
          Reference audio (≤30s) can guide the vibe, but we extract features only—no raw audio
          reuse.
        </p>
      </div>
    </div>
  )
}
