import React from 'react'

export default function GrapeVineLetter() {
  return (
    <div
      style={{ height: '100%' }}
      aria-hidden="true"
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: 'url(/vine-vertical.png)',
          backgroundRepeat: 'repeat-y',
          backgroundSize: '100% auto',
          backgroundPosition: 'center top',
          // Размытие только сверху — снизу без отступа
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%)',
        }}
      />
    </div>
  )
}
