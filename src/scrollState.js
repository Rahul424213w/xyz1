// Shared scroll value — lives OUTSIDE React, readable from inside Canvas useFrame
export const scrollState = {
  progress: 0,
  enabled: true,
}

export function resetScroll() {
  scrollState.progress = 0
  scrollState.enabled = true
}

export function initScroll() {
  const onWheel = (e) => {
    if (!scrollState.enabled) return
    // Adjusted sensitivity: advances spaceship in 5 to 6 scrolls instead of 10 to 15
    const delta = e.deltaY * 0.00024
    scrollState.progress = Math.max(0, Math.min(1, scrollState.progress + delta))
  }

  // Keyboard navigation support: ArrowDown, ArrowUp, PageDown, PageUp, Space (approx 6 presses)
  const onKeyDown = (e) => {
    if (!scrollState.enabled) return
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      scrollState.progress = Math.min(1, scrollState.progress + 0.16)
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      scrollState.progress = Math.max(0, scrollState.progress - 0.16)
    }
  }

  // Touch swipe support (smooth 4 to 5 swipes)
  let touchStartY = 0
  let isTouching = false

  const onTouchStart = (e) => {
    if (!scrollState.enabled) return
    if (!e.touches || e.touches.length === 0) return
    touchStartY = e.touches[0].clientY
    isTouching = true
  }

  const onTouchMove = (e) => {
    if (!scrollState.enabled || !isTouching) return
    if (!e.touches || e.touches.length === 0) return
    const touchY = e.touches[0].clientY
    const deltaY = touchStartY - touchY
    touchStartY = touchY
    scrollState.progress = Math.max(0, Math.min(1, scrollState.progress + deltaY * 0.0014))
  }

  const onTouchEnd = () => {
    isTouching = false
  }

  window.addEventListener('wheel', onWheel, { passive: true })
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('touchend', onTouchEnd, { passive: true })
  window.addEventListener('touchcancel', onTouchEnd, { passive: true })

  // Expose to window for inspection / testing
  window.__SHUTTLE_SCROLL__ = scrollState

  return () => {
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
    window.removeEventListener('touchcancel', onTouchEnd)
  }
}
