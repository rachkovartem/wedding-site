import React, { useState, useEffect } from 'react'
import Landing from './Landing.jsx'
import Admin from './Admin.jsx'
import Stats from './Stats.jsx'

/**
 * @returns {{ view: string, invitationId: string | null }}
 */
function parseHash() {
  const hash = window.location.hash.replace('#', '') || '/'
  if (hash.startsWith('/invite/')) {
    return { view: 'landing', invitationId: hash.replace('/invite/', '') }
  }
  if (hash === '/admin') return { view: 'admin', invitationId: null }
  if (hash === '/stats') return { view: 'stats', invitationId: null }
  return { view: 'landing', invitationId: null }
}

export default function App() {
  const [route, setRoute] = useState(parseHash)

  useEffect(() => {
    const handleHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  /**
   * @param {'landing' | 'admin' | 'stats'} view
   * @param {string | undefined} id
   */
  const navigate = (view, id) => {
    if (view === 'landing') window.location.hash = id ? `/invite/${id}` : '/'
    else window.location.hash = `/${view}`
  }

  if (route.view === 'admin') return <Admin onNavigate={navigate} />
  if (route.view === 'stats') return <Stats onNavigate={navigate} />
  return <Landing invitationId={route.invitationId} onNavigate={navigate} />
}
