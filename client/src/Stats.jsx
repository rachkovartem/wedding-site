import React, { useState, useEffect, useCallback } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { getAdminStats, postLogout } from './api.js'
import AuthModal from './components/AuthModal.jsx'

const SERIF_FONT = "'Lora', Georgia, serif"

/** @type {{ yes: string, no: string, pending: string }} */
const RSVP_COLORS = {
  yes: '#4A5D3F',
  no: '#A85838',
  pending: '#7A8579',
}

/** @param {{ label: string, value: string | number, sub?: string }} props */
function KpiCard({ label, value, sub }) {
  return (
    <div
      style={{
        background: '#2D352C',
        borderRadius: '4px',
        padding: '1.5rem',
        border: '1px solid rgba(168,134,74,0.2)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          color: '#A8864A',
          lineHeight: 1,
          marginBottom: '4px',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: 'Cormorant SC, Georgia, serif',
          fontSize: '0.8rem',
          color: '#7A8579',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      {sub && (
        <div style={{ fontFamily: SERIF_FONT, fontSize: '0.8rem', color: '#A8864A', marginTop: '4px' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

/**
 * @typedef {{
 *   total_invitations: number,
 *   opened_invitations: number,
 *   confirmed_guests: number,
 *   total_views: number,
 *   rsvp_breakdown: { yes_count: number, no_count: number, pending_count: number },
 *   views_per_day: Array<{ date: string, count: number }>,
 *   guests: Array<{
 *     id: string,
 *     guest_name: string,
 *     rsvp_status: string | null,
 *     view_count: number,
 *     last_viewed_at: number | null,
 *     views: Array<{ id: number, invitation_id: string, viewed_at: number, ip_address: string, country: string, city: string, user_agent: string }>
 *   }>
 * }} StatsData
 */

/**
 * @param {string | undefined} ua
 * @returns {string}
 */
const getDeviceType = (ua) => {
  if (!ua) return '—'
  return /Mobile|Android|iPhone|iPad/i.test(ua) ? 'Mobile' : 'Desktop'
}

/**
 * @param {{ onNavigate: (view: string) => void }} props
 */
export default function Stats({ onNavigate }) {
  const [stats, setStats] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Table state
  const [sortKey, setSortKey] = useState('guest_name')
  const [sortDir, setSortDir] = useState('asc')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedRows, setExpandedRows] = useState(new Set())

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getAdminStats()
      setStats(data)
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err && err.status === 401) {
        setShowAuth(true)
      } else {
        setError('Не удалось загрузить статистику.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleAuthSuccess = () => {
    setShowAuth(false)
    loadStats()
  }

  const handleLogout = async () => {
    try {
      await postLogout()
    } finally {
      onNavigate('landing')
    }
  }

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const btnStyle = {
    padding: '8px 20px',
    border: '1px solid rgba(168,134,74,0.5)',
    borderRadius: '3px',
    background: '#5C1F1F',
    color: '#D4B896',
    fontFamily: 'Cormorant SC, Georgia, serif',
    letterSpacing: '0.1em',
    fontSize: '0.9rem',
    cursor: 'pointer',
  }

  const thStyle = {
    fontFamily: 'Cormorant SC, Georgia, serif',
    fontSize: '0.8rem',
    color: '#A8864A',
    letterSpacing: '0.1em',
    padding: '10px 12px',
    textAlign: 'left',
    cursor: 'pointer',
    userSelect: 'none',
    borderBottom: '1px solid rgba(168,134,74,0.2)',
    background: '#2D352C',
  }

  const tdStyle = {
    padding: '10px 12px',
    fontFamily: SERIF_FONT,
    fontSize: '0.9rem',
    color: '#D4B896',
    borderBottom: '1px solid rgba(168,134,74,0.1)',
  }

  // Prepare data for charts
  const pieData = stats?.rsvp_breakdown
    ? [
        { name: 'Придут', value: stats.rsvp_breakdown.yes_count, key: 'yes' },
        { name: 'Не придут', value: stats.rsvp_breakdown.no_count, key: 'no' },
        { name: 'Ожидается', value: stats.rsvp_breakdown.pending_count, key: 'pending' },
      ].filter((d) => d.value > 0)
    : []

  // Sort and filter guests
  const guests = stats?.guests ?? []
  const filteredGuests = filterStatus === 'all'
    ? guests
    : guests.filter((g) => (g.rsvp_status ?? 'pending') === filterStatus)

  const sortedGuests = [...filteredGuests].sort((a, b) => {
    let av, bv
    switch (sortKey) {
      case 'guest_name':
        av = a.guest_name.toLowerCase()
        bv = b.guest_name.toLowerCase()
        break
      case 'rsvp_status':
        av = a.rsvp_status ?? 'pending'
        bv = b.rsvp_status ?? 'pending'
        break
      case 'view_count':
        av = a.view_count ?? 0
        bv = b.view_count ?? 0
        break
      case 'last_viewed_at':
        av = a.last_viewed_at ?? ''
        bv = b.last_viewed_at ?? ''
        break
      default:
        return 0
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const openedPct = stats && stats.total_invitations > 0
    ? Math.round((stats.opened_invitations / stats.total_invitations) * 100)
    : 0

  return (
    <div style={{ background: '#1F2A24', minHeight: '100vh', color: '#D4B896' }}>
      {showAuth && (
        <AuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => onNavigate('landing')}
        />
      )}

      {/* Header */}
      <header
        style={{
          background: '#2D352C',
          padding: '1.5rem 2rem',
          borderBottom: '1px solid rgba(168,134,74,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <h1
          className="font-sc"
          style={{ color: '#A8864A', fontSize: '1.5rem', letterSpacing: '0.1em', margin: 0 }}
        >
          СТАТИСТИКА
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => onNavigate('admin')}
            style={{ ...btnStyle, background: '#4A5D3F' }}
          >
            Управление
          </button>
          <button
            onClick={() => onNavigate('landing')}
            style={{ ...btnStyle, background: 'transparent' }}
          >
            На сайт
          </button>
          <button onClick={handleLogout} style={{ ...btnStyle, background: '#8B4A2E' }}>
            Выйти
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>

        {isLoading && (
          <p style={{ color: '#7A8579', fontStyle: 'italic', textAlign: 'center', padding: '3rem' }}>
            Загрузка...
          </p>
        )}

        {error && !isLoading && (
          <p style={{ color: '#A85838', textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>
            {error}
          </p>
        )}

        {stats && !isLoading && (
          <>
            {/* KPI Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem',
              }}
            >
              <KpiCard label="Всего приглашений" value={stats.total_invitations} />
              <KpiCard
                label="Открыто"
                value={stats.opened_invitations}
                sub={`${openedPct}%`}
              />
              <KpiCard label="Подтверждено" value={stats.confirmed_guests} />
              <KpiCard label="Отказались" value={stats.rsvp_breakdown?.no_count || 0} />
            </div>

            {/* Charts row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem',
              }}
            >
              {/* Pie chart — RSVP breakdown */}
              <div
                style={{
                  background: '#2D352C',
                  borderRadius: '4px',
                  padding: '1.5rem',
                  border: '1px solid rgba(168,134,74,0.2)',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    color: '#A8864A',
                    fontSize: '1.1rem',
                    marginBottom: '1rem',
                    marginTop: 0,
                  }}
                >
                  Распределение RSVP
                </h2>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={true}
                        style={{ fontFamily: SERIF_FONT, fontSize: '0.75rem' }}
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={RSVP_COLORS[entry.key]}
                          />
                        ))}
                      </Pie>
                      <Legend
                        formatter={(value) => (
                          <span style={{ fontFamily: SERIF_FONT, fontSize: '0.8rem', color: '#D4B896' }}>
                            {value}
                          </span>
                        )}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#2D352C',
                          border: '1px solid #A8864A',
                          borderRadius: '3px',
                          fontFamily: SERIF_FONT,
                          color: '#D4B896',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ color: '#7A8579', textAlign: 'center', fontStyle: 'italic' }}>
                    Нет данных
                  </p>
                )}
              </div>

              {/* Line chart — views per day */}
              <div
                style={{
                  background: '#2D352C',
                  borderRadius: '4px',
                  padding: '1.5rem',
                  border: '1px solid rgba(168,134,74,0.2)',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    color: '#A8864A',
                    fontSize: '1.1rem',
                    marginBottom: '1rem',
                    marginTop: 0,
                  }}
                >
                  Просмотры по дням
                </h2>
                {(stats.views_per_day?.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={stats.views_per_day}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontFamily: SERIF_FONT, fontSize: '0.7rem', fill: '#7A8579' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontFamily: SERIF_FONT, fontSize: '0.7rem', fill: '#7A8579' }}
                        tickLine={false}
                        axisLine={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#2D352C',
                          border: '1px solid #A8864A',
                          borderRadius: '3px',
                          fontFamily: SERIF_FONT,
                          color: '#D4B896',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#722F37"
                        strokeWidth={2}
                        dot={{ fill: '#722F37', r: 3 }}
                        activeDot={{ r: 5, fill: '#A8864A' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ color: '#7A8579', textAlign: 'center', fontStyle: 'italic' }}>
                    Нет данных
                  </p>
                )}
              </div>
            </div>

            {/* Guest table */}
            <div
              style={{
                background: '#2D352C',
                borderRadius: '4px',
                border: '1px solid rgba(168,134,74,0.2)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '1.5rem 1.5rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    color: '#A8864A',
                    fontSize: '1.1rem',
                    margin: 0,
                  }}
                >
                  Список гостей
                </h2>
                {/* Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    background: '#1F2A24',
                    border: '1px solid rgba(168,134,74,0.4)',
                    borderRadius: '3px',
                    padding: '6px 12px',
                    color: '#D4B896',
                    fontFamily: SERIF_FONT,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">Все</option>
                  <option value="yes">Придут</option>
                  <option value="no">Не придут</option>
                  <option value="pending">Ожидается</option>
                </select>
              </div>

              <div style={{ overflowX: 'auto', padding: '0 1.5rem 1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead>
                    <tr>
                      <th style={thStyle} onClick={() => handleSort('guest_name')}>
                        Имя {sortKey === 'guest_name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th style={thStyle} onClick={() => handleSort('rsvp_status')}>
                        RSVP {sortKey === 'rsvp_status' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th style={thStyle} onClick={() => handleSort('view_count')}>
                        Просмотров {sortKey === 'view_count' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th style={thStyle} onClick={() => handleSort('last_viewed_at')}>
                        Посл. визит {sortKey === 'last_viewed_at' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th style={{ ...thStyle, cursor: 'default' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedGuests.map((guest) => (
                      <React.Fragment key={guest.id}>
                        <tr
                          style={{
                            cursor: 'pointer',
                            background: expandedRows.has(guest.id)
                              ? 'rgba(168,134,74,0.08)'
                              : 'transparent',
                          }}
                          onClick={() => toggleRow(guest.id)}
                        >
                          <td style={tdStyle}>{guest.guest_name}</td>
                          <td style={tdStyle}>
                            <span
                              style={{
                                color:
                                  guest.rsvp_status === 'yes'
                                    ? '#4A5D3F'
                                    : guest.rsvp_status === 'no'
                                    ? '#A85838'
                                    : '#7A8579',
                                fontFamily: 'Cormorant SC, Georgia, serif',
                              }}
                            >
                              {guest.rsvp_status === 'yes'
                                ? 'Придёт'
                                : guest.rsvp_status === 'no'
                                ? 'Не придёт'
                                : 'Ожидается'}
                            </span>
                          </td>
                          <td style={tdStyle}>{guest.view_count ?? 0}</td>
                          <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#7A8579' }}>
                            {guest.last_viewed_at
                              ? new Date(guest.last_viewed_at).toLocaleDateString('ru-RU')
                              : '—'}
                          </td>
                          <td style={{ ...tdStyle, color: '#A8864A', fontSize: '0.85rem' }}>
                            {expandedRows.has(guest.id) ? '▲' : '▼'}
                          </td>
                        </tr>
                        {/* Expanded view history */}
                        {expandedRows.has(guest.id) && (
                          <tr>
                            <td
                              colSpan={5}
                              style={{
                                padding: '0.75rem 1.5rem',
                                background: 'rgba(31,42,36,0.5)',
                                borderBottom: '1px solid rgba(168,134,74,0.1)',
                              }}
                            >
                              {(guest.views?.length ?? 0) === 0 ? (
                                <p style={{ color: '#7A8579', fontStyle: 'italic', margin: 0, fontSize: '0.85rem' }}>
                                  Просмотров нет
                                </p>
                              ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr>
                                      {['Дата/время', 'Город', 'Страна', 'Устройство'].map((h) => (
                                        <th
                                          key={h}
                                          style={{
                                            fontFamily: 'Cormorant SC, Georgia, serif',
                                            fontSize: '0.75rem',
                                            color: '#7A8579',
                                            padding: '4px 8px',
                                            textAlign: 'left',
                                            letterSpacing: '0.08em',
                                          }}
                                        >
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {guest.views.map((v, i) => (
                                      <tr key={i}>
                                        <td style={{ ...tdStyle, padding: '4px 8px', fontSize: '0.8rem', color: '#A8864A' }}>
                                          {new Date(v.viewed_at).toLocaleString('ru-RU')}
                                        </td>
                                        <td style={{ ...tdStyle, padding: '4px 8px', fontSize: '0.8rem' }}>
                                          {v.city || '—'}
                                        </td>
                                        <td style={{ ...tdStyle, padding: '4px 8px', fontSize: '0.8rem' }}>
                                          {v.country || '—'}
                                        </td>
                                        <td style={{ ...tdStyle, padding: '4px 8px', fontSize: '0.8rem', color: '#7A8579' }}>
                                          {getDeviceType(v.user_agent)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {sortedGuests.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{ ...tdStyle, textAlign: 'center', color: '#7A8579', fontStyle: 'italic', padding: '2rem' }}
                        >
                          Нет гостей с таким статусом
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
