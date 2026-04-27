import React from 'react'

/**
 * @param {{ scrollPhase: number }} props
 */
export default function Mountains({ scrollPhase }) {
  const offset1 = scrollPhase * 0.1
  const offset2 = scrollPhase * 0.2
  const offset3 = scrollPhase * 0.05

  return (
    <div className="absolute inset-0 flex items-end pointer-events-none">
      {/* Farthest mountains */}
      <svg
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        className="absolute bottom-0 w-full h-64 md:h-80"
        style={{ transform: `translateY(${offset1}px)` }}
        aria-hidden="true"
      >
        <path
          d="M0,400 L0,220 L160,100 L280,180 L420,60 L560,140 L700,40 L860,130 L1000,70 L1140,150 L1280,80 L1440,120 L1440,400 Z"
          fill="#162019"
          opacity="0.95"
        />
      </svg>

      {/* Mid mountains */}
      <svg
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        className="absolute bottom-0 w-full h-56 md:h-72"
        style={{ transform: `translateY(${offset2}px)` }}
        aria-hidden="true"
      >
        <path
          d="M0,400 L0,240 L120,160 L240,210 L380,120 L500,190 L640,100 L800,170 L920,130 L1060,200 L1180,140 L1320,190 L1440,160 L1440,400 Z"
          fill="#1E2D22"
          opacity="0.98"
        />
      </svg>

      {/* Front mountains with vine-dark color */}
      <svg
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        className="absolute bottom-0 w-full h-44 md:h-60"
        style={{ transform: `translateY(${offset3}px)` }}
        aria-hidden="true"
      >
        <path
          d="M0,400 L0,280 L80,240 L180,270 L300,210 L420,260 L520,220 L660,260 L760,230 L880,265 L980,240 L1120,270 L1240,250 L1380,275 L1440,265 L1440,400 Z"
          fill="#2D352C"
          opacity="1"
        />
      </svg>

      {/* Vine silhouettes on left edge */}
      <svg
        viewBox="0 0 120 400"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-16 md:w-24 h-full"
        style={{ opacity: 0.7 }}
        aria-hidden="true"
      >
        <path d="M10,400 Q15,340 5,280 Q20,220 8,160 Q25,100 10,40" stroke="#4A5D3F" strokeWidth="3" fill="none"/>
        <ellipse cx="18" cy="200" rx="14" ry="10" fill="#4A5D3F" opacity="0.8" transform="rotate(-20, 18, 200)"/>
        <ellipse cx="5" cy="150" rx="12" ry="9" fill="#4A5D3F" opacity="0.7" transform="rotate(15, 5, 150)"/>
        <ellipse cx="22" cy="280" rx="10" ry="8" fill="#5C6B47" opacity="0.8" transform="rotate(-10, 22, 280)"/>
        {/* Grape cluster */}
        <circle cx="8" cy="130" r="5" fill="#5C1F1F" opacity="0.85"/>
        <circle cx="14" cy="136" r="5" fill="#5C1F1F" opacity="0.85"/>
        <circle cx="8" cy="142" r="5" fill="#5C1F1F" opacity="0.85"/>
        <circle cx="14" cy="148" r="4" fill="#5C1F1F" opacity="0.75"/>
      </svg>

      {/* Vine silhouettes on right edge */}
      <svg
        viewBox="0 0 120 400"
        preserveAspectRatio="none"
        className="absolute bottom-0 right-0 w-16 md:w-24 h-full"
        style={{ opacity: 0.7, transform: 'scaleX(-1)' }}
        aria-hidden="true"
      >
        <path d="M10,400 Q15,340 5,280 Q20,220 8,160 Q25,100 10,40" stroke="#4A5D3F" strokeWidth="3" fill="none"/>
        <ellipse cx="18" cy="200" rx="14" ry="10" fill="#4A5D3F" opacity="0.8" transform="rotate(-20, 18, 200)"/>
        <ellipse cx="5" cy="150" rx="12" ry="9" fill="#4A5D3F" opacity="0.7" transform="rotate(15, 5, 150)"/>
        <ellipse cx="22" cy="280" rx="10" ry="8" fill="#5C6B47" opacity="0.8" transform="rotate(-10, 22, 280)"/>
        <circle cx="8" cy="130" r="5" fill="#5C1F1F" opacity="0.85"/>
        <circle cx="14" cy="136" r="5" fill="#5C1F1F" opacity="0.85"/>
        <circle cx="8" cy="142" r="5" fill="#5C1F1F" opacity="0.85"/>
      </svg>
    </div>
  )
}
