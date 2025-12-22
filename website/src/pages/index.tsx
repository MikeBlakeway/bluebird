import { useEffect } from 'react'

export default function HomeRedirect() {
  useEffect(() => {
    window.location.replace('/docs/intro')
  }, [])

  return (
    <main style={{ padding: 24 }}>
      <h1>Bluebird Documentation</h1>
      <p>Redirecting to documentation…</p>
      <p>
        If you are not redirected, click <a href="/docs/intro">here to go to the docs</a>.
      </p>
    </main>
  )
}
