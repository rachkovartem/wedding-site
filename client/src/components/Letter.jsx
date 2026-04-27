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
const PROGRAM = [
  { time: '14:00', title: 'Регистрация', desc: 'Торжественная церемония в духе грузинских традиций' },
  { time: '15:30', title: 'Фуршет на закате', desc: 'Вино, саперави, хинкали — среди виноградников на закатном солнце' },
  { time: '18:00', title: 'Праздничный ужин', desc: 'Длинный стол, кахетинские блюда, грузинские тосты от тамады' },
  { time: '20:00', title: 'Тосты и полифония', desc: 'Живая грузинская полифония, тосты за здоровье и любовь' },
  { time: '22:00', title: 'Танцы под звёздами', desc: 'Музыка, танцы, звёзды над горами Кахетии' },
  { time: '00:00', title: 'Поздний стол', desc: 'Чурчхела, сыры, оставшееся вино и тёплые разговоры' },
]

function generateICS() {
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wedding Ira & Artem//RU',
    'BEGIN:VEVENT',
    'DTSTART:20260622T140000',
    'DTEND:20260622T230000',
    'SUMMARY:Свадьба Иры и Артёма',
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

/**
 * @typedef {{ id?: string, guest_name?: string, plus_one_allowed?: number, rsvp_status?: string | null } | null} Invitation
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
              <div
                className="font-georgian text-center mb-2"
                style={{ color: '#8B4A2E', fontSize: '1rem', letterSpacing: '0.15em' }}
              >
                ირა & არტიომი
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
                  Дорогой/Дорогая {guestName},
                </p>
              )}
              <p
                style={{
                  color: '#5C1F1F',
                  fontSize: '1rem',
                  lineHeight: 1.8,
                  maxWidth: '500px',
                  margin: '1rem auto 0',
                  fontStyle: 'italic',
                }}
              >
                среди виноградников и гор Кахетии мы зовём вас разделить с нами этот особенный день.
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
                  marginBottom: '0.5rem',
                }}
              >
                22 ИЮНЯ 2026
              </p>
              <p
                className="font-georgian"
                style={{ color: '#8B4A2E', fontSize: '0.9rem', marginBottom: '2rem' }}
              >
                22 ივნისი, 2026
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
                  textAlign: 'center',
                  lineHeight: 1.8,
                  maxWidth: '500px',
                  margin: '0 auto 2rem',
                  fontStyle: 'italic',
                }}
              >
                Среди виноградников и гор Кахетии — винодельня In Gremi, где горы встречают небо,
                а туман над Алазанской долиной хранит тысячелетние тайны.
              </p>
              <p
                className="text-center"
                style={{
                  color: '#8B4A2E',
                  fontSize: '0.85rem',
                  fontStyle: 'italic',
                  marginBottom: '2rem',
                }}
              >
                41.8°N, 45.8°E
              </p>

              {/* Polaroid map */}
              <div
                className="mx-auto"
                style={{
                  maxWidth: '300px',
                  transform: 'rotate(-2deg)',
                  background: 'white',
                  padding: '12px 12px 40px',
                  boxShadow: '4px 4px 20px rgba(0,0,0,0.3)',
                  marginBottom: '2rem',
                }}
              >
                <svg viewBox="0 0 280 200" xmlns="http://www.w3.org/2000/svg" className="w-full">
                  <rect width="280" height="200" fill="#E8DCC8"/>
                  {/* Stylized Kakheti map */}
                  <path
                    d="M40,100 Q80,60 140,80 Q200,60 240,90 Q220,140 180,160 Q140,180 100,150 Q60,140 40,100 Z"
                    fill="#C9A876"
                    stroke="#8B4A2E"
                    strokeWidth="1.5"
                  />
                  {/* Mountains */}
                  <polygon points="60,95 80,65 100,95" fill="#7A8579" opacity="0.7"/>
                  <polygon points="90,90 115,58 140,90" fill="#7A8579" opacity="0.6"/>
                  <polygon points="160,85 180,62 200,85" fill="#7A8579" opacity="0.5"/>
                  {/* Vineyard lines */}
                  <line x1="100" y1="130" x2="180" y2="130" stroke="#4A5D3F" strokeWidth="1" opacity="0.7"/>
                  <line x1="100" y1="140" x2="180" y2="140" stroke="#4A5D3F" strokeWidth="1" opacity="0.7"/>
                  <line x1="100" y1="150" x2="170" y2="150" stroke="#4A5D3F" strokeWidth="1" opacity="0.7"/>
                  {/* Location pin */}
                  <circle cx="148" cy="108" r="8" fill="#5C1F1F"/>
                  <circle cx="148" cy="108" r="4" fill="#D4B896"/>
                  <text x="148" y="96" textAnchor="middle" fill="#5C1F1F" fontSize="9" fontFamily="Lora, serif">
                    In Gremi
                  </text>
                  {/* Alazani river */}
                  <path
                    d="M30,155 Q80,145 140,158 Q200,165 250,155"
                    stroke="#7A8579"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.6"
                  />
                  <text
                    x="140"
                    y="170"
                    textAnchor="middle"
                    fill="#7A8579"
                    fontSize="7"
                    fontFamily="Lora, serif"
                    fontStyle="italic"
                  >
                    Алазанская долина
                  </text>
                </svg>
                <p
                  className="text-center mt-2"
                  style={{
                    fontFamily: 'Italianno, cursive',
                    color: '#5C1F1F',
                    fontSize: '1rem',
                  }}
                >
                  In Gremi, Кахетия
                </p>
              </div>

              {/* ICS download button */}
              <div className="text-center">
                <button
                  onClick={generateICS}
                  className="cursor-pointer"
                  aria-label="Скачать .ics файл для календаря"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <svg
                    viewBox="0 0 80 80"
                    className="w-16 h-16"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle cx="40" cy="40" r="36" fill="#5C1F1F"/>
                    <circle cx="40" cy="40" r="30" fill="none" stroke="#A8864A" strokeWidth="1.5" strokeDasharray="3 2"/>
                    <text
                      x="40"
                      y="36"
                      textAnchor="middle"
                      fill="#D4B896"
                      fontFamily="Cormorant SC, serif"
                      fontSize="9"
                      fontStyle="italic"
                    >
                      Сохранить
                    </text>
                    <text
                      x="40"
                      y="48"
                      textAnchor="middle"
                      fill="#D4B896"
                      fontFamily="Cormorant SC, serif"
                      fontSize="9"
                      fontStyle="italic"
                    >
                      дату
                    </text>
                  </svg>
                  <span style={{ color: '#8B4A2E', fontSize: '0.8rem', fontStyle: 'italic' }}>
                    скачать .ics
                  </span>
                </button>
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
                Программа дня
              </h2>
              <Timeline events={PROGRAM} />
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
                  <p style={{ color: '#5C1F1F', lineHeight: 1.8, fontSize: '0.95rem' }}>
                    Саперави, Ркацители, Мцване — кахетинские вина с тысячелетней историей, выдержанные в квеври.
                    Тёмный, бархатный Саперави — вино цвета ночи.
                  </p>
                </div>
                <div>
                  <h3 style={{ color: '#8B4A2E', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    Грузинская кухня
                  </h3>
                  <p style={{ color: '#5C1F1F', lineHeight: 1.8, fontSize: '0.95rem' }}>
                    Хинкали с бараниной, хачапури по-аджарски, мцвади на углях, сулугуни, чурчхела с грецким орехом.
                  </p>
                </div>
                <div>
                  <h3 style={{ color: '#8B4A2E', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    Что посмотреть
                  </h3>
                  <p style={{ color: '#5C1F1F', lineHeight: 1.8, fontSize: '0.95rem' }}>
                    Монастырь Алаверди (XI в.), Сигнаги — город любви, Телави, Крепость Греми рядом с виноградниками.
                  </p>
                </div>
                <div>
                  <h3 style={{ color: '#8B4A2E', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    Природа
                  </h3>
                  <p style={{ color: '#5C1F1F', lineHeight: 1.8, fontSize: '0.95rem' }}>
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
                22 июня 2026 · In Gremi · Кахетия
              </div>
            </div>

          </div>
        </div>
      </div>
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
