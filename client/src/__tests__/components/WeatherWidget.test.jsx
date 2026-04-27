import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import React from 'react'

import Letter from '../../components/Letter.jsx'

const INVITATION = { id: 'test-id', guest_name: 'Тест', salutation: 'Дорогой', plus_one_allowed: 0, rsvp_status: null }

// ── Climate mode response fixture (> 16 days until June 22) ──────────────────
// Values chosen so Math.round produces distinct integers per day:
//   Day1: max=30, min=18 → "30° / 18°"   precip=1.4mm
//   Day2: max=32, min=19 → "32° / 19°"   precip=0.0mm
const CLIMATE_RESPONSE = {
  daily: {
    time: ['2026-06-22', '2026-06-23'],
    temperature_2m_max: [30.0, 32.0],
    temperature_2m_min: [18.0, 19.0],
    precipitation_sum: [1.4, 0.0],
  },
}

// ── Forecast mode response fixture (≤ 16 days until June 22) ─────────────────
// Values chosen so Math.round produces distinct integers per day:
//   Day1: max=28, min=16, weathercode=1 (⛅) → "⛅ 28° / 16°"
//   Day2: max=24, min=14, weathercode=61 (🌧️) → "🌧️ 24° / 14°"
const FORECAST_RESPONSE = {
  daily: {
    time: ['2026-06-22', '2026-06-23'],
    temperature_2m_max: [28.0, 24.0],
    temperature_2m_min: [16.0, 14.0],
    precipitation_probability_max: [10, 35],
    weathercode: [1, 61],
  },
}

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Stub the global Date so `new Date()` (no args) returns a fixed timestamp.
 * `new Date(string)` still parses correctly because OrigDate is captured
 * BEFORE the stub replaces globalThis.Date.
 * @param {number} frozenMs - epoch milliseconds to freeze "now" at
 */
function stubDateNow(frozenMs) {
  const OrigDate = globalThis.Date
  class MockDate extends OrigDate {
    constructor(...args) {
      if (args.length === 0) super(frozenMs)
      else super(.../** @type {ConstructorParameters<typeof OrigDate>} */ (args))
    }
    static now() { return frozenMs }
    static parse(...args) { return OrigDate.parse(...args) }
    static UTC(...args) { return OrigDate.UTC(...args) }
  }
  vi.stubGlobal('Date', MockDate)
}

// Epoch ms values verified via node:
// new Date('2026-04-27T12:00:00Z').getTime() === 1777291200000  → 55 days before Jun 22
// new Date('2026-06-12T12:00:00Z').getTime() === 1781265600000  → 9 days before Jun 22
const EPOCH_APR27 = 1777291200000
const EPOCH_JUN12 = 1781265600000

/** Mock fetch with a given resolved value */
function mockFetch(responseBody) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => responseBody,
  })
}

function mockFetchError() {
  global.fetch = vi.fn().mockRejectedValue(new Error('network error'))
}

/**
 * Wait for the weather widget to finish loading and return its container.
 * The widget renders inside a div with data-testid="weather-widget".
 */
async function waitForWidget() {
  await waitFor(() => {
    const widget = document.querySelector('[data-testid="weather-widget"]')
    expect(widget).not.toBeNull()
    // Must have finished loading (no loading text)
    expect(widget.textContent).not.toMatch(/загружается/i)
  }, { timeout: 3000 })
  return document.querySelector('[data-testid="weather-widget"]')
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('WeatherWidget', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    delete global.fetch
  })

  describe('climate mode (> 16 days until June 22)', () => {
    beforeEach(() => {
      stubDateNow(EPOCH_APR27) // April 27, 2026 — 55 days before wedding
      mockFetch(CLIMATE_RESPONSE)
    })

    it('renders the "Климат в июне" label', async () => {
      render(<Letter invitation={INVITATION} />)
      const widget = await waitForWidget()
      expect(within(widget).getByText('Климат в июне')).toBeInTheDocument()
    })

    it('shows the "точный прогноз появится" note', async () => {
      render(<Letter invitation={INVITATION} />)
      const widget = await waitForWidget()
      expect(within(widget).getByText(/точный прогноз появится/i)).toBeInTheDocument()
    })

    it('fetches from the climate API endpoint', async () => {
      render(<Letter invitation={INVITATION} />)
      await waitForWidget()
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('climate-api.open-meteo.com'),
      )
    })

    it('displays temperature range for June 22 (30° / 18°) without emoji', async () => {
      render(<Letter invitation={INVITATION} />)
      const widget = await waitForWidget()
      // CLIMATE_RESPONSE day1: max=30.0, min=18.0 → Math.round → "30° / 18°"
      expect(within(widget).getByText('30° / 18°')).toBeInTheDocument()
    })

    it('displays precipitation in mm for June 22', async () => {
      render(<Letter invitation={INVITATION} />)
      const widget = await waitForWidget()
      expect(within(widget).getByText('Осадки: 1.4 мм')).toBeInTheDocument()
    })

    it('displays day label "22 июня, пн"', async () => {
      render(<Letter invitation={INVITATION} />)
      const widget = await waitForWidget()
      expect(within(widget).getByText('22 июня, пн')).toBeInTheDocument()
    })

    it('displays day label "23 июня, вт"', async () => {
      render(<Letter invitation={INVITATION} />)
      const widget = await waitForWidget()
      expect(within(widget).getByText('23 июня, вт')).toBeInTheDocument()
    })
  })

  describe('forecast mode (≤ 16 days until June 22)', () => {
    beforeEach(() => {
      stubDateNow(EPOCH_JUN12) // June 12, 2026 — 9 days before wedding
      mockFetch(FORECAST_RESPONSE)
    })

    it('renders the "Прогноз погоды" label', async () => {
      render(<Letter invitation={INVITATION} />)
      const widget = await waitForWidget()
      expect(within(widget).getByText('Прогноз погоды')).toBeInTheDocument()
    })

    it('does NOT show the "точный прогноз появится" note', async () => {
      render(<Letter invitation={INVITATION} />)
      const widget = await waitForWidget()
      expect(within(widget).queryByText(/точный прогноз появится/i)).not.toBeInTheDocument()
    })

    it('fetches from the forecast API endpoint', async () => {
      render(<Letter invitation={INVITATION} />)
      await waitForWidget()
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.open-meteo.com/v1/forecast'),
      )
    })

    it('displays temperature with weather emoji for June 22 (code=1 → ⛅)', async () => {
      render(<Letter invitation={INVITATION} />)
      const widget = await waitForWidget()
      expect(within(widget).getByText('⛅ 28° / 16°')).toBeInTheDocument()
    })

    it('displays precipitation probability for June 22', async () => {
      render(<Letter invitation={INVITATION} />)
      const widget = await waitForWidget()
      expect(within(widget).getByText('Дождь: 10%')).toBeInTheDocument()
    })

    it('shows correct emoji for rainy day June 23 (code=61 → 🌧️)', async () => {
      render(<Letter invitation={INVITATION} />)
      const widget = await waitForWidget()
      // FORECAST_RESPONSE day2: max=24.0, min=14.0, weathercode=61 (🌧️) → "🌧️ 24° / 14°"
      expect(within(widget).getByText('🌧️ 24° / 14°')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows "загружается..." while fetching', () => {
      stubDateNow(EPOCH_APR27)
      global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))

      render(<Letter invitation={INVITATION} />)
      const widget = document.querySelector('[data-testid="weather-widget"]')
      expect(widget).not.toBeNull()
      expect(widget.textContent).toMatch(/загружается/i)
    })
  })

  describe('error state', () => {
    it('shows nothing (silent fail) when fetch errors', async () => {
      stubDateNow(EPOCH_APR27)
      mockFetchError()

      render(<Letter invitation={INVITATION} />)
      await waitFor(() => {
        // After error, widget renders null — element should not exist
        const widget = document.querySelector('[data-testid="weather-widget"]')
        expect(widget).toBeNull()
      }, { timeout: 3000 })
    })
  })

  describe('placement', () => {
    it('weather widget appears between map link and calendar button', async () => {
      stubDateNow(EPOCH_APR27)
      mockFetch(CLIMATE_RESPONSE)

      render(<Letter invitation={INVITATION} />)
      await waitForWidget()

      const mapLink = screen.getByText(/открыть на картах/i)
      const weatherWidget = document.querySelector('[data-testid="weather-widget"]')
      const calButton = screen.getByText(/добавить в календарь/i)

      // weatherWidget must come after mapLink in the DOM
      expect(
        mapLink.compareDocumentPosition(weatherWidget) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      // calButton must come after weatherWidget in the DOM
      expect(
        weatherWidget.compareDocumentPosition(calButton) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })
  })
})
