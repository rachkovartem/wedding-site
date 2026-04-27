import React from 'react'

/**
 * @typedef {{ time: string, title: string, desc: string }} TimelineEvent
 */

/**
 * @param {{ events: TimelineEvent[] }} props
 */
export default function Timeline({ events }) {
  return (
    <div className="relative" style={{ paddingLeft: '20px' }}>
      {/* Vertical connecting line */}
      <div
        style={{
          position: 'absolute',
          left: '95px',
          top: '12px',
          bottom: '12px',
          width: '1px',
          background: 'linear-gradient(to bottom, transparent, #A8864A 10%, #A8864A 90%, transparent)',
        }}
      />

      {events.map((event, index) => (
        <div
          key={index}
          className="relative flex gap-4 mb-8"
        >
          {/* Time */}
          <div
            style={{
              minWidth: '52px',
              textAlign: 'right',
              fontFamily: 'Cormorant SC, Georgia, serif',
              fontSize: '0.9rem',
              color: '#8B4A2E',
              paddingTop: '2px',
              letterSpacing: '0.05em',
            }}
          >
            {event.time}
          </div>

          {/* Dot */}
          <div
            style={{
              position: 'relative',
              width: '16px',
              height: '16px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#5C1F1F',
                border: '2px solid #A8864A',
                marginTop: '2px',
                marginLeft: '2px',
              }}
            />
          </div>

          {/* Content */}
          <div style={{ flex: 1, paddingBottom: '4px' }}>
            <h3
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '1.15rem',
                color: '#5C1F1F',
                margin: '0 0 4px',
                fontWeight: 600,
              }}
            >
              {event.title}
            </h3>
            <p
              style={{
                fontFamily: 'Lora, Georgia, serif',
                fontSize: '0.9rem',
                color: '#8B4A2E',
                margin: 0,
                lineHeight: 1.7,
                fontStyle: 'italic',
              }}
            >
              {event.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
