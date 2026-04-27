import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import App from '../App.jsx'

// Mock child pages to avoid complex rendering
vi.mock('../Landing.jsx', () => ({
  default: ({ invitationId }) => (
    <div data-testid="landing" data-invitation-id={invitationId || ''}>
      Landing
    </div>
  ),
}))

vi.mock('../Admin.jsx', () => ({
  default: () => <div data-testid="admin">Admin</div>,
}))

vi.mock('../Stats.jsx', () => ({
  default: () => <div data-testid="stats">Stats</div>,
}))

describe('App hash routing', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  afterEach(() => {
    window.location.hash = ''
  })

  it('renders Landing when hash is empty', () => {
    window.location.hash = ''
    render(<App />)
    expect(screen.getByTestId('landing')).toBeInTheDocument()
  })

  it('renders Landing when hash is #/', () => {
    window.location.hash = '/'
    render(<App />)
    expect(screen.getByTestId('landing')).toBeInTheDocument()
  })

  it('renders Landing with invitationId when hash is #/invite/abc123', () => {
    window.location.hash = '/invite/abc123'
    render(<App />)
    const landing = screen.getByTestId('landing')
    expect(landing).toBeInTheDocument()
    expect(landing.getAttribute('data-invitation-id')).toBe('abc123')
  })

  it('renders Admin when hash is #/admin', () => {
    window.location.hash = '/admin'
    render(<App />)
    expect(screen.getByTestId('admin')).toBeInTheDocument()
  })

  it('renders Stats when hash is #/stats', () => {
    window.location.hash = '/stats'
    render(<App />)
    expect(screen.getByTestId('stats')).toBeInTheDocument()
  })

  it('responds to hashchange events — switches to admin', async () => {
    window.location.hash = ''
    render(<App />)
    expect(screen.getByTestId('landing')).toBeInTheDocument()

    await act(async () => {
      window.location.hash = '/admin'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })

    expect(screen.getByTestId('admin')).toBeInTheDocument()
  })

  it('responds to hashchange events — switches to stats', async () => {
    window.location.hash = ''
    render(<App />)

    await act(async () => {
      window.location.hash = '/stats'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })

    expect(screen.getByTestId('stats')).toBeInTheDocument()
  })

  it('responds to hashchange — switches from admin back to landing', async () => {
    window.location.hash = '/admin'
    render(<App />)
    expect(screen.getByTestId('admin')).toBeInTheDocument()

    await act(async () => {
      window.location.hash = '/'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })

    expect(screen.getByTestId('landing')).toBeInTheDocument()
  })
})
