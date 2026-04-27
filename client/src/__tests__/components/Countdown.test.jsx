import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import Countdown from '../../components/Countdown.jsx'

describe('Countdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('displays days, hours, minutes, seconds labels', () => {
    const futureDate = new Date(Date.now() + 86400000 * 365)
    render(<Countdown targetDate={futureDate} />)
    expect(screen.getByText(/дней/i)).toBeInTheDocument()
    expect(screen.getByText(/часов/i)).toBeInTheDocument()
    expect(screen.getByText(/минут/i)).toBeInTheDocument()
    expect(screen.getByText(/секунд/i)).toBeInTheDocument()
  })

  it('displays numeric countdown values', () => {
    const futureDate = new Date(Date.now() + 86400000 * 10) // 10 days from now
    render(<Countdown targetDate={futureDate} />)
    // Should show some numbers
    const days = screen.getByTestId('countdown-days')
    expect(Number(days.textContent)).toBeGreaterThanOrEqual(9)
  })

  it('shows completion message when date is in the past', () => {
    const pastDate = new Date(Date.now() - 1000)
    render(<Countdown targetDate={pastDate} />)
    expect(screen.getByText(/торжество началось/i)).toBeInTheDocument()
  })

  it('updates every second', () => {
    const futureDate = new Date(Date.now() + 10000) // 10 seconds
    render(<Countdown targetDate={futureDate} />)
    const secondsBefore = screen.getByTestId('countdown-seconds').textContent

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    const secondsAfter = screen.getByTestId('countdown-seconds').textContent
    // Either the number changes or wraps — just verify it re-renders
    expect(Number(secondsBefore)).toBeGreaterThan(Number(secondsAfter))
  })

  it('shows zero when target date is exactly now', () => {
    const now = new Date(Date.now())
    render(<Countdown targetDate={now} />)
    expect(screen.getByText(/торжество началось/i)).toBeInTheDocument()
  })
})
