import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { WebVitals } from '@/components/web-vitals'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Bluebird - AI Music Composition',
    template: '%s | Bluebird',
  },
  description:
    'Create original music with AI. Paste lyrics, choose your style, and generate professional audio in seconds.',
  keywords: ['AI music', 'music composition', 'AI vocals', 'music generation', 'remix'],
  authors: [{ name: 'Bluebird' }],
  creator: 'Bluebird',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Bluebird - AI Music Composition',
    description:
      'Create original music with AI. Paste lyrics, choose your style, and generate professional audio in seconds.',
    siteName: 'Bluebird',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bluebird - AI Music Composition',
    description:
      'Create original music with AI. Paste lyrics, choose your style, and generate professional audio in seconds.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <WebVitals />
        <div className="min-h-screen flex flex-col">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <nav className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">🐦 Bluebird</h1>
                <div className="flex gap-4">{/* Navigation links will go here */}</div>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t py-6">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              <p>&copy; 2024 Bluebird. Original music, powered by AI.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
