import React, { useState } from 'react'
import Countdown from './Countdown.jsx'
import RsvpForm from './RsvpForm.jsx'
import Timeline from './Timeline.jsx'
import GrapeVineLetter from './GrapeVineLetter.jsx'
import { postRsvp } from '../api.js'

const WEDDING_DATE = new Date('2026-06-22T14:00:00')
const BRIDE = 'Ира'
const GROOM = 'Артём'

/** @type {Array<{ time: string, title: string, desc: string }>} */
const PROGRAM_DAY1 = [
  { time: '14:00', title: 'Регистрация', desc: 'Торжественная церемония в духе грузинских традиций' },
  { time: '15:30', title: 'Фуршет на закате', desc: 'Вино, саперави, хинкали — среди виноградников на закатном солнце' },
  { time: '18:00', title: 'Праздничный ужин', desc: 'Длинный стол, кахетинские блюда, грузинские тосты от тамады' },
  { time: '20:00', title: 'Тосты и полифония', desc: 'Живая грузинская полифония, тосты за здоровье и любовь' },
  { time: '22:00', title: 'Танцы под звёздами', desc: 'Музыка, танцы, звёзды над горами Кахетии' },
  { time: '00:00', title: 'Поздний стол', desc: 'Чурчхела, сыры, оставшееся вино и тёплые разговоры' },
]

/** @type {Array<{ time: string, title: string, desc: string }>} */
const PROGRAM_DAY2 = [
  { time: '10:00', title: 'Утренний стол', desc: 'Ароматный кофе, свежий хлеб, сыры и лёгкий завтрак среди виноградников' },
  { time: '12:00', title: 'Прогулка по виноградникам', desc: 'Экскурсия по виноградникам In Gremi, дегустация утреннего вина' },
  { time: '14:00', title: 'Обед', desc: 'Грузинский обед: мцвади, хачапури, зелень и домашние вина' },
  { time: '16:00', title: 'Свободное время', desc: 'Прогулки, бассейн, виды на Алазанскую долину и горы Кавказа' },
  { time: '18:00', title: 'Прощальный тост', desc: 'Последний стакан саперави, объятия и до новых встреч' },
]

function generateICS() {
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wedding Ira & Artem//RU',
    'BEGIN:VEVENT',
    'DTSTART:20260622T140000',
    'DTEND:20260623T230000',
    'SUMMARY:Свадьба Иры и Артёма — 22–23 июня',
    'LOCATION:In Gremi\\, Kakheti\\, Georgia',
    'DESCRIPTION:Вы приглашены на свадьбу Иры и Артёма среди гор Кахетии',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'wedding-ira-artem.ics'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function generateGoogleCalendarUrl() {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Свадьба Иры и Артёма',
    dates: '20260622T140000/20260623T230000',
    details: 'Вы приглашены на свадьбу Иры и Артёма среди виноградников и гор Кахетии. In Gremi, Кахетия, Грузия.',
    location: 'In Gremi, Kakheti, Georgia',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * @typedef {{ id?: string, guest_name?: string, salutation?: string, plus_one_allowed?: number, rsvp_status?: string | null } | null} Invitation
 */

/**
 * @param {{ invitation: Invitation, invitationId: string | null }} props
 */
export default function Letter({ invitation, invitationId }) {
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false)

  /**
   * @param {string} status
   * @param {boolean} plusOne
   */
  const handleRsvp = async (status, plusOne) => {
    if (!invitationId) return
    await postRsvp(invitationId, { status, plus_one: plusOne })
    setRsvpSubmitted(true)
  }

  const guestName = invitation?.guest_name
  const salutation = invitation?.salutation || 'Дорогой'

  return (
    <div style={{ minHeight: '100vh', background: '#D4B896', position: 'relative' }}>

      <div className="max-w-6xl mx-auto px-4 pt-8 pb-0">
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
              <div
                className="font-script mb-2"
                style={{
                  color: '#5C1F1F',
                  fontSize: 'clamp(3rem, 8vw, 5rem)',
                  lineHeight: 1.1,
                }}
              >
                {BRIDE} & {GROOM}
              </div>
              <p
                className="font-sc"
                style={{
                  color: '#5C1F1F',
                  fontSize: '0.95rem',
                  letterSpacing: '0.15em',
                  marginBottom: '1.5rem',
                }}
              >
                ПРИГЛАШАЮТ ВАС РАЗДЕЛИТЬ ДЕНЬ, КОГДА ДВА СЕРДЦА СТАНУТ ОДНИМ
              </p>
              {guestName && (
                <p className="font-script" style={{ color: '#8B4A2E', fontSize: '1.8rem' }}>
                  {salutation} {guestName},
                </p>
              )}
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
                Среди виноградников и гор Кахетии — винодельня In Gremi, где горы встречают небо,
                а туман над Алазанской долиной хранит тысячелетние тайны.
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

              {/* Add to Calendar */}
              <AddToCalendar />
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
                    Монастырь Алаверди (XI в.), Сигнаги — город любви, Телави, Крепость Греми рядом с виноградниками.
                  </p>
                </div>
                <div>
                  <h3 style={{ color: '#8B4A2E', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    Природа
                  </h3>
                  <p style={{ color: '#5C1F1F', lineHeight: 1.8, fontSize: '0.95rem', textAlign: 'left' }}>
                    Алазанская долина на рассвете, туман над виноградниками, Большой Кавказский хребет на горизонте.
                  </p>
                </div>
              </div>
            </section>

            <Divider />

            {/* Section 6: RSVP */}
            <section className="mb-16" id="rsvp">
              <h2
                className="text-center"
                style={{
                  color: '#5C1F1F',
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  marginBottom: '1rem',
                }}
              >
                Ответное письмо
              </h2>
              <p
                className="text-center"
                style={{ color: '#8B4A2E', fontStyle: 'italic', marginBottom: '2rem' }}
              >
                Просим подтвердить ваше присутствие до 1 июня 2026
              </p>
              {invitationId ? (
                <RsvpForm
                  invitation={invitation}
                  onSubmit={handleRsvp}
                  submitted={rsvpSubmitted}
                />
              ) : (
                <p
                  className="text-center"
                  style={{ color: '#8B4A2E', fontStyle: 'italic' }}
                >
                  Для ответа откройте персональную ссылку-приглашение.
                </p>
              )}
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

function AddToCalendar() {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="text-center" style={{ position: 'relative', display: 'inline-block', left: '50%', transform: 'translateX(-50%)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: '#5C1F1F',
          color: '#D4B896',
          border: '1px solid #A8864A',
          borderRadius: '4px',
          padding: '10px 24px',
          fontSize: '0.9rem',
          fontFamily: 'Lora, Georgia, serif',
          fontStyle: 'italic',
          cursor: 'pointer',
          letterSpacing: '0.05em',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
        }}
        aria-label="Добавить в календарь"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#D4B896" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Добавить в календарь
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />
          {/* Dropdown */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#2D2010',
              border: '1px solid #A8864A',
              borderRadius: '4px',
              minWidth: '200px',
              zIndex: 50,
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            {[
              {
                label: 'Google Календарь',
                onClick: () => { window.open(generateGoogleCalendarUrl(), '_blank'); setOpen(false) },
              },
              {
                label: 'Apple / iCal (.ics)',
                onClick: () => { generateICS(); setOpen(false) },
              },
              {
                label: 'Outlook (.ics)',
                onClick: () => { generateICS(); setOpen(false) },
              },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.onClick}
                style={{
                  display: 'block',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid rgba(168,134,74,0.2)',
                  padding: '10px 16px',
                  color: '#D4B896',
                  fontSize: '0.85rem',
                  fontFamily: 'Lora, Georgia, serif',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,134,74,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
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
