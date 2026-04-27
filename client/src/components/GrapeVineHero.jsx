import React from 'react'

export default function GrapeVineHero() {
  return (
    <div
      className="absolute left-0 top-0 h-full pointer-events-none hidden md:block"
      style={{
        width: '80px',
        zIndex: 3,
        animation: 'sway 8s ease-in-out infinite',
        transformOrigin: 'bottom center',
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 80 600" className="h-full w-full" preserveAspectRatio="xMidYMax meet">
        {/* Main stem */}
        <path
          d="M40,600 Q35,500 45,420 Q30,340 42,260 Q28,180 40,100 Q35,60 38,20"
          stroke="#4A5D3F"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Branches */}
        <path d="M42,400 Q20,380 10,360" stroke="#5C6B47" strokeWidth="1.5" fill="none"/>
        <path d="M38,280 Q15,260 5,240" stroke="#5C6B47" strokeWidth="1.5" fill="none"/>
        <path d="M42,180 Q60,165 70,150" stroke="#5C6B47" strokeWidth="1.5" fill="none"/>

        {/* Leaves */}
        <ellipse cx="10" cy="358" rx="12" ry="8" fill="#4A5D3F" opacity="0.85" transform="rotate(-30,10,358)"/>
        <ellipse cx="5" cy="238" rx="11" ry="7" fill="#4A5D3F" opacity="0.8" transform="rotate(20,5,238)"/>
        <ellipse cx="70" cy="148" rx="12" ry="8" fill="#5C6B47" opacity="0.85" transform="rotate(-15,70,148)"/>
        <ellipse cx="44" cy="120" rx="9" ry="6" fill="#4A5D3F" opacity="0.75" transform="rotate(10,44,120)"/>
        <ellipse cx="37" cy="320" rx="10" ry="7" fill="#5C6B47" opacity="0.8" transform="rotate(-20,37,320)"/>

        {/* Grape clusters */}
        <g opacity="0.9">
          <circle cx="8" cy="350" r="4.5" fill="#5C1F1F"/>
          <circle cx="14" cy="356" r="4.5" fill="#5C1F1F"/>
          <circle cx="8" cy="362" r="4.5" fill="#722F37"/>
          <circle cx="14" cy="368" r="4" fill="#5C1F1F"/>
          <circle cx="11" cy="374" r="3.5" fill="#722F37"/>
        </g>
        <g opacity="0.85">
          <circle cx="4" cy="230" r="4" fill="#5C1F1F"/>
          <circle cx="10" cy="236" r="4" fill="#722F37"/>
          <circle cx="4" cy="242" r="4" fill="#5C1F1F"/>
          <circle cx="10" cy="248" r="3.5" fill="#5C1F1F"/>
        </g>

        {/* Tendrils */}
        <path d="M42,460 Q55,450 58,440 Q55,430 48,435" stroke="#4A5D3F" strokeWidth="1" fill="none" opacity="0.6"/>
        <path d="M40,200 Q25,188 22,178 Q26,168 33,172" stroke="#4A5D3F" strokeWidth="1" fill="none" opacity="0.6"/>
      </svg>
    </div>
  )
}
