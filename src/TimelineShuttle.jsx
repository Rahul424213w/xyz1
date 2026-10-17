import React from 'react'

/*
 * High-Definition 4K Space Shuttle
 * Uses the authentic 4K master asset (public/rocket.webp) matching hack2future.iiitdwd.ac.in
 * Features crisp photographic detail, amber engine glow, and smooth direction flips.
 */
export default function TimelineShuttle({ direction = 'down', isAtTop = true }) {
  // In rocket.webp:
  // Default asset is horizontal.
  // rotate(90deg) -> nose points straight DOWN (when scrolling down)
  // rotate(-90deg) -> nose points straight UP (when at top or scrolling up)
  const angle = isAtTop ? -90 : direction === 'down' ? 90 : -90

  return (
    <div className="timeline-rocket-wrap">
      <img
        src="/rocket.webp"
        alt="Space Shuttle"
        className="timeline-rocket-img"
        style={{
          transform: `rotate(${angle}deg)`,
        }}
      />
    </div>
  )
}
