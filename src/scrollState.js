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
    // Gentle sensitivity: each scroll notch moves the ship a small amount ("going little")
    // allowing deep, smooth space travel
    const delta = e.deltaY * 0.0001
    scrollState.progress = Math.max(0, Math.min(1, scrollState.progress + delta))
  }

  // Keyboard navigation support: ArrowDown, ArrowUp, PageDown, PageUp, Space
  const onKeyDown = (e) => {
    if (!scrollState.enabled) return
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      scrollState.progress = Math.min(1, scrollState.progress + 0.03)
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      scrollState.progress = Math.max(0, scrollState.progress - 0.03)
    }
  }

  // Touch swipe support
  let touchStartY = 0
  const onTouchStart = (e) => {
    if (!scrollState.enabled) return
    touchStartY = e.touches[0].clientY
  }
  const onTouchMove = (e) => {
    if (!scrollState.enabled) return
    const touchY = e.touches[0].clientY
    const deltaY = touchStartY - touchY
    touchStartY = touchY
    scrollState.progress = Math.max(0, Math.min(1, scrollState.progress + deltaY * 0.0004))
  }

  window.addEventListener('wheel', onWheel, { passive: true })
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: true })

  // Expose to window for inspection / testing
  window.__SHUTTLE_SCROLL__ = scrollState

  return () => {
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
  }
}
