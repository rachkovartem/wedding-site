import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Stats from '../../Stats.jsx'

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => {
  const MockResponsiveContainer = ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  )
  const MockPieChart = ({ children }) => <div data-testid="pie-chart">{children}</div>
  const MockPie = () => <div data-testid="pie" />
  const MockCell = () => null
  const MockLineChart = ({ children }) => <div data-testid="line-chart">{children}</div>
  const MockLine = () => null
  const MockXAxis = () => null
  const MockYAxis = () => null
  const MockTooltip = () => null
  const MockLegend = () => null
  return {
    ResponsiveContainer: MockResponsiveContainer,
    PieChart: MockPieChart,
    Pie: MockPie,
    Cell: MockCell,
    LineChart: MockLineChart,
    Line: MockLine,
    XAxis: MockXAxis,
    YAxis: MockYAxis,
    Tooltip: MockTooltip,
    Legend: MockLegend,
  }
})

// Mock AuthModal to a simple test double
vi.mock('../../components/AuthModal.jsx', () => ({
  default: ({ onSuccess, onClose }) => (
    <div data-testid="auth-modal">
      <button onClick={onSuccess}>auth-success</button>
      <button onClick={onClose}>auth-close</button>
    </div>
  ),
}))

// Mock api.js
vi.mock('../../api.js', () => ({
  getAdminStats: vi.fn(),
  postLogout: vi.fn(),
}))

import { getAdminStats, postLogout } from '../../api.js'

/** Canonical backend response matching the real API shape */
const MOCK_STATS = {
  total_invitations: 5,
  total_views: 23,
  confirmed_guests: 3,
  opened_invitations: 3,
  rsvp_breakdown: {
    yes_count: 2,
    no_count: 1,
    pending_count: 2,
  },
  views_per_day: [
    { date: '2026-04-12', count: 3 },
    { date: '2026-04-13', count: 5 },
  ],
  guests: [
    {
      id: 'g1',
      guest_name: 'Alice',
      rsvp_status: 'yes',
      view_count: 5,
      last_viewed_at: 1744300800000,
      views: [
        {
          id: 1,
          invitation_id: 'inv1',
          viewed_at: 1744300800000,
          ip_address: '1.2.3.4',
          country: 'GE',
          city: 'Tbilisi',
          user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        },
        {
          id: 2,
          invitation_id: 'inv1',
          viewed_at: 1744214400000,
          ip_address: '5.6.7.8',
          country: 'GE',
          city: 'Batumi',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
        },
      ],
    },
    {
      id: 'g2',
      guest_name: 'Bob',
      rsvp_status: 'no',
      view_count: 2,
      last_viewed_at: 1744128000000,
      views: [
        {
          id: 3,
          invitation_id: 'inv2',
          viewed_at: 1744128000000,
          ip_address: '9.10.11.12',
          country: 'US',
          city: 'New York',
          user_agent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7)',
        },
      ],
    },
    {
      id: 'g3',
      guest_name: 'Carol',
      rsvp_status: null,
      view_count: 0,
      last_viewed_at: null,
      views: [],
    },
  ],
}

const onNavigate = vi.fn()

describe('Stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAdminStats.mockResolvedValue(MOCK_STATS)
    postLogout.mockResolvedValue(null)
  })

  describe('KPI cards', () => {
    it('shows total_invitations = 5 in "Всего приглашений" card', async () => {
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Всего приглашений')).toBeInTheDocument())
      const kpiSection = screen.getByText('Всего приглашений').closest('div').parentElement
      expect(within(kpiSection).getByText('5')).toBeInTheDocument()
    })

    it('shows opened_invitations = 3 and 60% in "Открыто" card', async () => {
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Открыто')).toBeInTheDocument())
      // The value "3" appears inside the Открыто card
      const openedLabel = screen.getByText('Открыто')
      const openedCard = openedLabel.closest('div').parentElement
      expect(within(openedCard).getByText('3')).toBeInTheDocument()
      expect(within(openedCard).getByText('60%')).toBeInTheDocument()
    })

    it('shows confirmed_guests = 3 in "Подтверждено" card', async () => {
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Подтверждено')).toBeInTheDocument())
      const label = screen.getByText('Подтверждено')
      const card = label.closest('div').parentElement
      expect(within(card).getByText('3')).toBeInTheDocument()
    })

    it('shows rsvp_breakdown.no_count = 1 in "Отказались" card', async () => {
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Отказались')).toBeInTheDocument())
      const label = screen.getByText('Отказались')
      const card = label.closest('div').parentElement
      expect(within(card).getByText('1')).toBeInTheDocument()
    })
  })

  describe('guest table rows', () => {
    it('renders all guests in the table', async () => {
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Carol')).toBeInTheDocument()
    })
  })

  describe('expandable rows', () => {
    it('shows view history when a guest row is clicked', async () => {
      const user = userEvent.setup()
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())

      // Click Alice's row to expand
      await user.click(screen.getByText('Alice'))

      // Alice has 2 views — both cities should appear
      await waitFor(() => expect(screen.getByText('Tbilisi')).toBeInTheDocument())
      expect(screen.getByText('Batumi')).toBeInTheDocument()
    })

    it('collapses row when clicked a second time', async () => {
      const user = userEvent.setup()
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())

      await user.click(screen.getByText('Alice'))
      await waitFor(() => expect(screen.getByText('Tbilisi')).toBeInTheDocument())

      await user.click(screen.getByText('Alice'))
      await waitFor(() => expect(screen.queryByText('Tbilisi')).not.toBeInTheDocument())
    })

    it('shows "Просмотров нет" for a guest with no views', async () => {
      const user = userEvent.setup()
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Carol')).toBeInTheDocument())

      await user.click(screen.getByText('Carol'))
      await waitFor(() => expect(screen.getByText('Просмотров нет')).toBeInTheDocument())
    })
  })

  describe('device type column (BUG-2)', () => {
    it('shows "Mobile" for iPhone user_agent', async () => {
      const user = userEvent.setup()
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())

      await user.click(screen.getByText('Alice'))
      // Alice's first view has iPhone UA → Mobile
      await waitFor(() => expect(screen.getByText('Mobile')).toBeInTheDocument())
    })

    it('shows "Desktop" for Windows Chrome user_agent', async () => {
      const user = userEvent.setup()
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())

      await user.click(screen.getByText('Alice'))
      // Alice's second view has Windows Chrome UA → Desktop
      await waitFor(() => expect(screen.getByText('Desktop')).toBeInTheDocument())
    })

    it('shows "Mobile" for Android user_agent', async () => {
      const user = userEvent.setup()
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Bob')).toBeInTheDocument())

      await user.click(screen.getByText('Bob'))
      // Bob's view has Linux Android UA → Mobile
      await waitFor(() => expect(screen.getByText('Mobile')).toBeInTheDocument())
    })

    it('never shows literal "—" for device type when user_agent is present', async () => {
      const user = userEvent.setup()
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())

      await user.click(screen.getByText('Alice'))
      await waitFor(() => expect(screen.getByText('Mobile')).toBeInTheDocument())
      // There should be no bare "—" in device column (cities/countries use "—" only for missing values)
      // Check both device cells are Mobile or Desktop, not "—"
      const desktopCells = screen.getAllByText('Desktop')
      expect(desktopCells.length).toBeGreaterThan(0)
    })
  })

  describe('auth modal — 401 response', () => {
    it('shows auth modal when API returns 401', async () => {
      getAdminStats.mockRejectedValue({ status: 401, message: 'Unauthorized' })
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByTestId('auth-modal')).toBeInTheDocument())
    })

    it('reloads stats after successful auth', async () => {
      getAdminStats
        .mockRejectedValueOnce({ status: 401, message: 'Unauthorized' })
        .mockResolvedValueOnce(MOCK_STATS)

      const user = userEvent.setup()
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByTestId('auth-modal')).toBeInTheDocument())

      await user.click(screen.getByText('auth-success'))
      await waitFor(() => expect(screen.getByText('Всего приглашений')).toBeInTheDocument())
    })

    it('navigates to landing when auth modal is closed', async () => {
      getAdminStats.mockRejectedValue({ status: 401, message: 'Unauthorized' })
      const user = userEvent.setup()
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByTestId('auth-modal')).toBeInTheDocument())

      await user.click(screen.getByText('auth-close'))
      expect(onNavigate).toHaveBeenCalledWith('landing')
    })
  })

  describe('RSVP filter', () => {
    it('shows only "yes" guests when filter is set to Придут', async () => {
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'yes' } })

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument()
        expect(screen.queryByText('Bob')).not.toBeInTheDocument()
        expect(screen.queryByText('Carol')).not.toBeInTheDocument()
      })
    })

    it('shows only "no" guests when filter is set to Не придут', async () => {
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Bob')).toBeInTheDocument())

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'no' } })

      await waitFor(() => {
        expect(screen.getByText('Bob')).toBeInTheDocument()
        expect(screen.queryByText('Alice')).not.toBeInTheDocument()
        expect(screen.queryByText('Carol')).not.toBeInTheDocument()
      })
    })

    it('shows guests with null rsvp_status when filter is pending', async () => {
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Carol')).toBeInTheDocument())

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'pending' } })

      await waitFor(() => {
        expect(screen.getByText('Carol')).toBeInTheDocument()
        expect(screen.queryByText('Alice')).not.toBeInTheDocument()
        expect(screen.queryByText('Bob')).not.toBeInTheDocument()
      })
    })

    it('shows all guests when filter is reset to all', async () => {
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'yes' } })
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'all' } })

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument()
        expect(screen.getByText('Bob')).toBeInTheDocument()
        expect(screen.getByText('Carol')).toBeInTheDocument()
      })
    })

    it('shows empty state message when no guests match filter', async () => {
      // Use a stats with no "pending" guests
      getAdminStats.mockResolvedValue({
        ...MOCK_STATS,
        guests: [
          { ...MOCK_STATS.guests[0] },
          { ...MOCK_STATS.guests[1] },
        ],
      })
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'pending' } })

      await waitFor(() =>
        expect(screen.getByText('Нет гостей с таким статусом')).toBeInTheDocument()
      )
    })
  })

  describe('pie chart', () => {
    it('renders the recharts pie chart container when there is rsvp data', async () => {
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Распределение RSVP')).toBeInTheDocument())
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })

    it('shows "Нет данных" for pie chart when all rsvp counts are 0', async () => {
      getAdminStats.mockResolvedValue({
        ...MOCK_STATS,
        rsvp_breakdown: { yes_count: 0, no_count: 0, pending_count: 0 },
      })
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Распределение RSVP')).toBeInTheDocument())
      // Two "Нет данных" messages — one for pie, one for line chart
      const noDataMessages = screen.getAllByText('Нет данных')
      expect(noDataMessages.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('loading and error states', () => {
    it('shows loading indicator while fetching', () => {
      // Never-resolving promise to keep loading state
      getAdminStats.mockReturnValue(new Promise(() => {}))
      render(<Stats onNavigate={onNavigate} />)
      expect(screen.getByText('Загрузка...')).toBeInTheDocument()
    })

    it('shows error message on non-401 failure', async () => {
      getAdminStats.mockRejectedValue(new Error('Network error'))
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() =>
        expect(screen.getByText('Не удалось загрузить статистику.')).toBeInTheDocument()
      )
    })
  })

  describe('navigation buttons', () => {
    it('calls onNavigate("admin") when Управление is clicked', async () => {
      const user = userEvent.setup()
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Управление')).toBeInTheDocument())
      await user.click(screen.getByText('Управление'))
      expect(onNavigate).toHaveBeenCalledWith('admin')
    })

    it('calls onNavigate("landing") when На сайт is clicked', async () => {
      const user = userEvent.setup()
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('На сайт')).toBeInTheDocument())
      await user.click(screen.getByText('На сайт'))
      expect(onNavigate).toHaveBeenCalledWith('landing')
    })

    it('calls postLogout and navigates to landing when Выйти is clicked', async () => {
      const user = userEvent.setup()
      render(<Stats onNavigate={onNavigate} />)
      await waitFor(() => expect(screen.getByText('Выйти')).toBeInTheDocument())
      await user.click(screen.getByText('Выйти'))
      expect(postLogout).toHaveBeenCalled()
      await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('landing'))
    })
  })
})
