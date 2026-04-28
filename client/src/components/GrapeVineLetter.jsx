import React from 'react'

/**
 * @param {{ yOffset?: number, anchor?: 'top' | 'bottom' }} props
 *   yOffset — how many px into the tile pattern to start (default 0 = tile top).
 *             Pass (cardVineLen % tileH) so the vine continues seamlessly from the card.
 *   anchor  — 'top' (default) starts the pattern from the top; 'bottom' anchors it to the bottom edge.
 */
export default function GrapeVineLetter({ yOffset = 0, anchor = 'top' }) {
  const backgroundPosition = anchor === 'bottom'
    ? 'center bottom'
    : yOffset ? `center -${yOffset}px` : 'center top'

  return (
    <div style={{ height: '100%' }} aria-hidden="true">
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: 'url(/vine-vertical.png)',
          backgroundRepeat: 'repeat-y',
          backgroundSize: '100% auto',
          backgroundPosition,
        }}
      />
    </div>
  )
}
