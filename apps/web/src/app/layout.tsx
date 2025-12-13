import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bluebird - AI Music Composition',
  description: 'Create original music with AI. Paste lyrics, choose your style, and generate professional audio in seconds.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <nav className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">🐦 Bluebird</h1>
                <div className="flex gap-4">
                  {/* Navigation links will go here */}
                </div>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
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
