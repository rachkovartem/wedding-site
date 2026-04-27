import React from 'react'
import Countdown from './Countdown.jsx'
import Timeline from './Timeline.jsx'
import GrapeVineLetter from './GrapeVineLetter.jsx'

const WEDDING_DATE = new Date('2026-06-22T14:00:00')
const BRIDE = 'Ира'
const GROOM = 'Артём'

/** @type {Array<{ time: string, title: string, desc: string }>} */
const PROGRAM_DAY1 = [
  { time: '14:00', title: 'Регистрация', desc: 'Торжественная церемония в духе грузинских традиций' },
  { time: '15:30', title: 'Фуршет на закате', desc: 'Закуски, вино и хинкали под открытым небом — пока солнце уходит за горы' },
  { time: '18:00', title: 'Праздничный ужин', desc: 'Длинный стол, кахетинские блюда, грузинские тосты от тамады' },
  { time: '20:00', title: 'Тосты и полифония', desc: 'Живая грузинская полифония, тосты за здоровье и любовь' },
  { time: '22:00', title: 'Танцы под звёздами', desc: 'Музыка, танцы, звёзды над горами Кахетии' },
  { time: '00:00', title: 'Поздний стол', desc: 'Чурчхела, сыры, оставшееся вино и тёплые разговоры' },
]

/** @type {Array<{ time: string, title: string, desc: string }>} */
const PROGRAM_DAY2 = [
  { time: '10:00', title: 'Утренний стол', desc: 'Ароматный кофе, свежий хлеб и сыры — завтрак не спеша, с видом на горы' },
  { time: '12:00', title: 'Прогулка по территории', desc: 'Прогулка по территории In Gremi, свежий воздух и утреннее вино — если хочется' },
  { time: '14:00', title: 'Обед', desc: 'Грузинский обед: мцвади, хачапури, зелень и домашние вина' },
  { time: '16:00', title: 'Свободное время', desc: 'Прогулки, бассейн, виды на Алазанскую долину и горы Кавказа' },
  { time: '18:00', title: 'Прощальный тост', desc: 'Последний стакан саперави, объятия и до новых встреч' },
]


/**
 * @typedef {{ id?: string, guest_name?: string, salutation?: string, plus_one_allowed?: number, rsvp_status?: string | null } | null} Invitation
 */

/**
 * @param {{ invitation: Invitation }} props
 */
export default function Letter({ invitation }) {
  const guestName = invitation?.guest_name
  const salutation = invitation?.salutation || 'Дорогой'

  return (
    <div className="paper-texture" style={{ minHeight: '100vh', position: 'relative' }}>

      {/* Mobile vine background overlay — hidden on lg+ where the sidebar vine takes over */}
      <div
        className="lg:hidden"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: 'url(/vine-vertical.png)',
          backgroundRepeat: 'repeat-y',
          backgroundSize: '40% auto',
          backgroundPosition: 'left top',
          opacity: 0.12,
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%)',
        }}
      />

      <div className="max-w-6xl mx-auto px-4 pt-8 pb-0" style={{ position: 'relative', zIndex: 1 }}>
        {/* Two-column layout at lg+ */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left column — vine decoration (lg+ only) */}
          <div className="hidden lg:block" style={{ width: '28%', minWidth: '200px', alignSelf: 'stretch' }}>
            <GrapeVineLetter />
          </div>

          {/* Right column — content */}
          <div className="flex-1">

            {/* Section 1: Names */}
            <section className="text-center mb-16">
              {guestName && (
                <p
                  className="font-script mb-2"
                  style={{
                    color: '#5C1F1F',
                    fontSize: 'clamp(1.8rem, 5vw, 3rem)',
                    lineHeight: 1.1,
                  }}
                >
                  {salutation} {guestName},
                </p>
              )}
              <p
                className="font-sc"
                style={{
                  color: '#5C1F1F',
                  fontSize: '0.95rem',
                  letterSpacing: '0.15em',
                  marginBottom: '1.5rem',
                }}
              >
                {BRIDE.toUpperCase()} И {GROOM.toUpperCase()} НАЧИНАЮТ ОДНУ ИСТОРИЮ НА ДВОИХ. И ОЧЕНЬ ХОТЯТ, ЧТОБЫ ВЫ БЫЛИ РЯДОМ
              </p>
            </section>

            <Divider />

            {/* Section 2: Date + Countdown */}
            <section className="text-center mb-16">
              <h2
                style={{
                  color: '#5C1F1F',
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  marginBottom: '0.5rem',
                }}
              >
                Когда
              </h2>
              <p
                className="font-sc"
                style={{
                  color: '#8B4A2E',
                  fontSize: '1.4rem',
                  letterSpacing: '0.1em',
                  marginBottom: '2rem',
                }}
              >
                22–23 ИЮНЯ 2026
              </p>
              <p style={{ color: '#5C1F1F', fontStyle: 'italic', marginBottom: '2rem' }}>
                До нашего праздника осталось...
              </p>
              <Countdown targetDate={WEDDING_DATE} />
            </section>

            <Divider />

            {/* Section 3: Venue + Map + ICS */}
            <section className="mb-16">
              <h2
                className="text-center"
                style={{
                  color: '#5C1F1F',
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  marginBottom: '0.5rem',
                }}
              >
                Где
              </h2>
              <p
                className="font-sc text-center"
                style={{
                  color: '#8B4A2E',
                  fontSize: '1.2rem',
                  letterSpacing: '0.1em',
                  marginBottom: '1rem',
                }}
              >
                IN GREMI, КАХЕТИЯ, ГРУЗИЯ
              </p>
              <p
                style={{
                  color: '#5C1F1F',
                  textAlign: 'left',
                  lineHeight: 1.8,
                  maxWidth: '500px',
                  margin: '0 auto 2rem',
                  fontStyle: 'italic',
                }}
              >
                In Gremi — уютный отель в горах Кахетии, где можно выдохнуть, замедлиться и просто побыть вместе. Горы, воздух, вид на Алазанскую долину — и никакой суеты.
              </p>
              {/* Polaroid photo */}
              <div
                className="mx-auto"
                style={{
                  maxWidth: '340px',
                  transform: 'rotate(-1.5deg)',
                  background: 'white',
                  padding: '10px 10px 44px',
                  boxShadow: '4px 6px 24px rgba(0,0,0,0.35)',
                  marginBottom: '2rem',
                }}
              >
                <img
                  src="/in-gremi.jpg"
                  alt="Вид из In Gremi — замок Греми и горы Кахетии"
                  style={{
                    width: '100%',
                    display: 'block',
                    objectFit: 'cover',
                    aspectRatio: '4/3',
                  }}
                />
                <p
                  className="text-center mt-2"
                  style={{
                    fontFamily: "'Marck Script', cursive",
                    color: '#5C1F1F',
                    fontSize: '1.1rem',
                  }}
                >
                  In Gremi, Кахетия
                </p>
              </div>

              {/* Google Maps link */}
              <div className="text-center" style={{ marginBottom: '2rem' }}>
                <a
                  href="https://share.google/Ac6tQjGuLkEa0ufQK"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#8B4A2E',
                    fontSize: '0.9rem',
                    fontStyle: 'italic',
                    textDecoration: 'none',
                    borderBottom: '1px solid rgba(139,74,46,0.4)',
                    paddingBottom: '1px',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#8B4A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Открыть на картах
                </a>
              </div>

              {/* Weather widget */}
              <WeatherWidget />

              {/* Add to Calendar */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <AddToCalendar />
              </div>
            </section>

            <Divider />

            {/* Section 4: Program timeline */}
            <section className="mb-16">
              <h2
                className="text-center"
                style={{
                  color: '#5C1F1F',
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  marginBottom: '2rem',
                }}
              >
                Программа
              </h2>

              <h3
                style={{
                  color: '#8B4A2E',
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  marginBottom: '1.25rem',
                  textAlign: 'center',
                }}
              >
                День первый — 22 июня
              </h3>
              <Timeline events={PROGRAM_DAY1} />

              <Divider />

              <h3
                style={{
                  color: '#8B4A2E',
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  marginBottom: '1.25rem',
                  textAlign: 'center',
                }}
              >
                День второй — 23 июня
              </h3>
              <Timeline events={PROGRAM_DAY2} />
            </section>

            <Divider />

            {/* Section 5: Local delights */}
            <section className="mb-16">
              <h2
                className="text-center"
                style={{
                  color: '#5C1F1F',
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  marginBottom: '1.5rem',
                }}
              >
                Кахетия — что попробовать
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 style={{ color: '#8B4A2E', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    Вина Кахетии
                  </h3>
                  <p style={{ color: '#5C1F1F', lineHeight: 1.8, fontSize: '0.95rem', textAlign: 'left' }}>
                    Саперави, Ркацители, Мцване — кахетинские вина с тысячелетней историей, выдержанные в квеври.
                    Тёмный, бархатный Саперави — вино цвета ночи.
                  </p>
                </div>
                <div>
                  <h3 style={{ color: '#8B4A2E', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    Грузинская кухня
                  </h3>
                  <p style={{ color: '#5C1F1F', lineHeight: 1.8, fontSize: '0.95rem', textAlign: 'left' }}>
                    Хинкали с бараниной, хачапури по-аджарски, мцвади на углях, сулугуни, чурчхела с грецким орехом.
                  </p>
                </div>
                <div>
                  <h3 style={{ color: '#8B4A2E', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    Что посмотреть
                  </h3>
                  <p style={{ color: '#5C1F1F', lineHeight: 1.8, fontSize: '0.95rem', textAlign: 'left' }}>
                    Монастырь Алаверди (XI в.), Сигнаги — город любви, Телави, Крепость Греми в пяти минутах от нас.
                  </p>
                </div>
                <div>
                  <h3 style={{ color: '#8B4A2E', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    Природа
                  </h3>
                  <p style={{ color: '#5C1F1F', lineHeight: 1.8, fontSize: '0.95rem', textAlign: 'left' }}>
                    Алазанская долина на рассвете, туман над холмами, Большой Кавказский хребет на горизонте.
                  </p>
                </div>
              </div>
            </section>

            {/* Signature */}
            <div className="text-center py-8">
              <div
                className="font-script mb-2"
                style={{ color: '#5C1F1F', fontSize: '3rem' }}
              >
                Ира & Артём
              </div>
              <div style={{ color: '#8B4A2E', fontStyle: 'italic', fontSize: '0.9rem' }}>
                22–23 июня 2026 · In Gremi · Кахетия
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}


// ─── Weather widget ─────────────────────────────────────────────────────────

const WEDDING_DAY1 = new Date('2026-06-22T00:00:00')
const FORECAST_THRESHOLD_DAYS = 14

/** @param {number} code */
function weatherEmoji(code) {
  if (code === 0) return '☀️'
  if (code <= 2)  return '⛅'
  if (code <= 3)  return '☁️'
  if (code <= 49) return '🌫️'
  if (code <= 59) return '🌦️'
  if (code <= 69) return '🌧️'
  if (code <= 79) return '🌨️'
  if (code <= 82) return '🌧️'
  return '⛈️'
}

const DAY_LABELS = ['22 июня, пн', '23 июня, вт']

/**
 * @typedef {{ maxTemp: number, minTemp: number, precip: string, emoji?: string }} DayData
 */

function WeatherWidget() {
  const [status, setStatus] = React.useState(/** @type {'loading'|'done'|'error'} */ ('loading'))
  const [isForecast, setIsForecast] = React.useState(false)
  const [days, setDays] = React.useState(/** @type {DayData[]} */ ([]))

  React.useEffect(() => {
    const now = new Date()
    const msUntilWedding = WEDDING_DAY1.getTime() - now.getTime()
    const daysUntil = msUntilWedding / (1000 * 60 * 60 * 24)
    const useForecast = daysUntil <= FORECAST_THRESHOLD_DAYS

    if (useForecast) {
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=41.73&longitude=45.72&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=Asia%2FTbilisi&start_date=2026-06-22&end_date=2026-06-23'
      fetch(url)
        .then(res => res.json())
        .then(data => {
          const d = data.daily
          /** @type {DayData[]} */
          const parsed = [0, 1].map(i => {
            const maxTemp = Math.round(d.temperature_2m_max[i])
            const minTemp = Math.round(d.temperature_2m_min[i])
            const prob = d.precipitation_probability_max[i]
            const code = d.weathercode[i]
            return {
              maxTemp,
              minTemp,
              precip: `Дождь: ${prob}%`,
              emoji: weatherEmoji(code),
            }
          })
          setIsForecast(true)
          setDays(parsed)
          setStatus('done')
        })
        .catch(() => setStatus('error'))
    } else {
      const url = 'https://archive-api.open-meteo.com/v1/archive?latitude=41.73&longitude=45.72&start_date=2019-06-20&end_date=2024-06-25&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FTbilisi'
      fetch(url)
        .then(res => res.json())
        .then(data => {
          const times = data.daily.time
          const tmaxArr = data.daily.temperature_2m_max
          const tminArr = data.daily.temperature_2m_min
          const precipArr = data.daily.precipitation_sum

          const june22 = times.reduce(
            /** @param {number[]} acc @param {string} t @param {number} i */
            (acc, t, i) => t.endsWith('-06-22') ? [...acc, i] : acc,
            /** @type {number[]} */ ([])
          )
          const june23 = times.reduce(
            /** @param {number[]} acc @param {string} t @param {number} i */
            (acc, t, i) => t.endsWith('-06-23') ? [...acc, i] : acc,
            /** @type {number[]} */ ([])
          )

          /**
           * @param {number[]} indices
           * @param {number[]} arr
           */
          const avg = (indices, arr) =>
            indices.reduce((s, i) => s + arr[i], 0) / indices.length

          const precipLabel = (mm) => {
            if (mm < 1)  return '☀️ Дождь маловероятен'
            if (mm < 7)  return '🌤 Возможен лёгкий дождь'
            if (mm < 15) return '🌦 Дождливо'
            return '🌧 Очень дождливо'
          }

          /** @type {DayData[]} */
          const parsed = [
            {
              maxTemp: Math.round(avg(june22, tmaxArr)),
              minTemp: Math.round(avg(june22, tminArr)),
              precip: precipLabel(avg(june22, precipArr)),
            },
            {
              maxTemp: Math.round(avg(june23, tmaxArr)),
              minTemp: Math.round(avg(june23, tminArr)),
              precip: precipLabel(avg(june23, precipArr)),
            },
          ]

          setIsForecast(false)
          setDays(parsed)
          setStatus('done')
        })
        .catch(() => setStatus('error'))
    }
  }, [])

  if (status === 'error') return null

  if (status === 'loading') {
    return (
      <div data-testid="weather-widget" style={{ maxWidth: '340px', margin: '0 auto 2rem', textAlign: 'center' }}>
        <p style={{
          color: '#8B4A2E',
          fontSize: '0.85rem',
          fontFamily: 'Cormorant SC, serif',
          letterSpacing: '0.1em',
          fontStyle: 'italic',
        }}>
          загружается...
        </p>
      </div>
    )
  }

  return (
    <div data-testid="weather-widget" style={{ maxWidth: '340px', margin: '0 auto 2rem', textAlign: 'center' }}>
      <p style={{
        color: '#8B4A2E',
        fontSize: '0.85rem',
        letterSpacing: '0.1em',
        fontFamily: 'Cormorant SC, serif',
        marginBottom: '0.75rem',
      }}>
        {isForecast ? 'Прогноз погоды' : 'Типичная погода в июне'}
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        {days.map((day, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(92,31,31,0.06)',
              borderRadius: '6px',
              padding: '0.75rem 1rem',
              minWidth: '120px',
            }}
          >
            <p style={{ color: '#8B4A2E', fontSize: '0.8rem', fontStyle: 'italic', margin: '0 0 0.25rem' }}>
              {DAY_LABELS[i]}
            </p>
            <p style={{ color: '#5C1F1F', fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 0.25rem' }}>
              {day.emoji ? `${day.emoji} ${day.maxTemp}° / ${day.minTemp}°` : `${day.maxTemp}° / ${day.minTemp}°`}
            </p>
            <p style={{ color: '#8B4A2E', fontSize: '0.75rem', margin: 0 }}>
              {day.precip}
            </p>
          </div>
        ))}
      </div>

      {!isForecast && (
        <p style={{
          color: '#8B4A2E',
          fontSize: '0.75rem',
          fontStyle: 'italic',
          marginTop: '0.5rem',
        }}>
          Среднее за 2019–2024 · Точный прогноз появится за 2 недели
        </p>
      )}
    </div>
  )
}

// ─── Calendar event data ────────────────────────────────────────────────────
const CAL_EVENT = {
  title:       'Свадьба Иры и Артёма',
  location:    'In Gremi, Kakheti, Georgia',
  description: 'Вы приглашены на свадьбу Иры и Артёма — два дня в горах Кахетии с теми, кто важен.',
  // Asia/Tbilisi = UTC+4; 14:00 local = 10:00 UTC
  startUtc:    '20260622T100000Z',
  endUtc:      '20260623T190000Z',
  // For services that accept local time + timezone
  startLocal:  '2026-06-22T14:00:00',
  endLocal:    '2026-06-23T23:00:00',
  timeZone:    'Asia/Tbilisi',
}

// ─── URL builders (reverse-engineered from add-to-calendar-button) ───────────

function googleCalendarUrl() {
  const p = new URLSearchParams({
    action:   'TEMPLATE',
    text:     CAL_EVENT.title,
    dates:    `${CAL_EVENT.startUtc}/${CAL_EVENT.endUtc}`,
    details:  CAL_EVENT.description,
    location: CAL_EVENT.location,
    ctz:      CAL_EVENT.timeZone,
  })
  return `https://calendar.google.com/calendar/render?${p}`
}

function outlookUrl() {
  const p = new URLSearchParams({
    path:      '/calendar/action/compose',
    rru:       'addevent',
    subject:   CAL_EVENT.title,
    startdt:   CAL_EVENT.startLocal,
    enddt:     CAL_EVENT.endLocal,
    location:  CAL_EVENT.location,
    body:      CAL_EVENT.description,
  })
  return `https://outlook.live.com/calendar/0/deeplink/compose?${p}`
}

function office365Url() {
  const p = new URLSearchParams({
    path:      '/calendar/action/compose',
    rru:       'addevent',
    subject:   CAL_EVENT.title,
    startdt:   CAL_EVENT.startLocal,
    enddt:     CAL_EVENT.endLocal,
    location:  CAL_EVENT.location,
    body:      CAL_EVENT.description,
  })
  return `https://outlook.office.com/calendar/0/deeplink/compose?${p}`
}

function downloadIcs() {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'PRODID:-//Wedding Ira & Artem//RU',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART;TZID=${CAL_EVENT.timeZone}:20260622T140000`,
    `DTEND;TZID=${CAL_EVENT.timeZone}:20260623T230000`,
    `SUMMARY:${CAL_EVENT.title}`,
    `LOCATION:${CAL_EVENT.location}`,
    `DESCRIPTION:${CAL_EVENT.description}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([lines], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'wedding-ira-artem.ics'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ─── Platform detection ──────────────────────────────────────────────────────
function detectPlatform() {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  if (/android/i.test(ua))                              return 'android'
  if (/iphone|ipad|ipod/i.test(ua))                    return 'ios'
  if (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return 'ios' // iPad desktop mode
  return 'other'
}

// ─── Options list ────────────────────────────────────────────────────────────
function buildOptions() {
  const platform = detectPlatform()
  const all = [
    {
      key:    'google',
      label:  'Google Календарь',
      action: () => window.open(googleCalendarUrl(), '_blank'),
    },
    {
      key:    'apple',
      label:  'Apple Календарь',
      action: downloadIcs,
    },
    {
      key:    'outlook',
      label:  'Outlook',
      action: () => window.open(outlookUrl(), '_blank'),
    },
    {
      key:    'office365',
      label:  'Office 365',
      action: () => window.open(office365Url(), '_blank'),
    },
    {
      key:    'ical',
      label:  'iCal (.ics)',
      action: downloadIcs,
    },
  ]
  // Sort: put the most relevant option first for the platform
  if (platform === 'ios') {
    return [all[1], all[0], all[4], all[2], all[3]] // Apple first
  }
  if (platform === 'android') {
    return [all[0], all[2], all[3], all[4], all[1]] // Google first
  }
  return all // desktop: Google, Apple, Outlook, Office365, iCal
}

// ─── Component ───────────────────────────────────────────────────────────────
function AddToCalendar() {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [open])

  const options = buildOptions()

  return (
    <div
      ref={ref}
      className="text-center"
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:        'inline-flex',
          alignItems:     'center',
          gap:            '8px',
          background:     '#5C1F1F',
          color:          '#D4B896',
          border:         '1px solid rgba(168,134,74,0.6)',
          borderRadius:   '3px',
          padding:        '10px 22px',
          fontSize:       '0.9rem',
          fontFamily:     'Lora, Georgia, serif',
          fontStyle:      'italic',
          letterSpacing:  '0.05em',
          cursor:         'pointer',
        }}
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8"  y1="2" x2="8"  y2="6"/>
          <line x1="3"  y1="10" x2="21" y2="10"/>
        </svg>
        Добавить в календарь
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position:     'absolute',
            top:          'calc(100% + 4px)',
            left:         '50%',
            transform:    'translateX(-50%)',
            background:   '#1F2A24',
            border:       '1px solid rgba(168,134,74,0.4)',
            borderRadius: '3px',
            minWidth:     '210px',
            zIndex:       50,
            boxShadow:    '0 6px 20px rgba(0,0,0,0.5)',
            overflow:     'hidden',
          }}
        >
          {options.map((opt, i) => (
            <button
              key={opt.key}
              onClick={() => { opt.action(); setOpen(false) }}
              style={{
                display:      'block',
                width:        '100%',
                background:   'none',
                border:       'none',
                borderBottom: i < options.length - 1
                  ? '1px solid rgba(168,134,74,0.15)'
                  : 'none',
                padding:      '10px 16px',
                color:        '#D4B896',
                fontSize:     '0.875rem',
                fontFamily:   'Lora, Georgia, serif',
                textAlign:    'left',
                cursor:       'pointer',
                transition:   'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,134,74,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              {i === 0 && (
                <span style={{
                  fontSize:      '0.7rem',
                  color:         '#A8864A',
                  fontStyle:     'italic',
                  letterSpacing: '0.08em',
                  display:       'block',
                  marginBottom:  '1px',
                }}>
                  рекомендуем
                </span>
              )}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-4 my-8">
      <div
        style={{
          flex: 1,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #A8864A, transparent)',
        }}
      />
      <svg viewBox="0 0 40 20" width="40" height="20" aria-hidden="true">
        <path d="M20,10 Q15,4 10,10 Q15,16 20,10 Z" fill="#A8864A" opacity="0.7"/>
        <path d="M20,10 Q25,4 30,10 Q25,16 20,10 Z" fill="#A8864A" opacity="0.7"/>
        <circle cx="20" cy="10" r="2" fill="#A8864A"/>
      </svg>
      <div
        style={{
          flex: 1,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #A8864A, transparent)',
        }}
      />
    </div>
  )
}
