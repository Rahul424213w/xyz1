// ── Lightweight wheel smoother (Lenis-style) ──
// Intercepts vertical wheel input on a scroll container and eases scrollTop
// toward the target with frame-rate-independent exponential damping.
// Native scrollbar dragging, keyboard scrolling, touch momentum, and
// programmatic scrollIntoView all keep working via external-scroll resync.

const WHEEL_LINE_PX = 16

function canScrollY(node, dy) {
  const style = getComputedStyle(node)
  const oy = style.overflowY
  if (oy !== 'auto' && oy !== 'scroll' && oy !== 'overlay') return false
  const max = node.scrollHeight - node.clientHeight
  if (max <= 1) return false
  if (dy < 0) return node.scrollTop > 0
  return node.scrollTop < max - 0.5
}

// If a nested element (e.g. long dropdown panel) can still scroll vertically
// in the wheel direction, let the native event through untouched.
function findNestedScrollable(target, dy, scrollerEl) {
  let node = target instanceof Element ? target.parentElement : null
  while (node && node !== scrollerEl && node !== document.body && node !== document.documentElement) {
    if (canScrollY(node, dy)) return node
    node = node.parentElement
  }
  return null
}

/**
 * @param {Window|Element|null} scroller - window for document scroll, or a scrollable element
 * @param {{ lambda?: number }} [options] - damping strength (higher = snappier)
 * @returns {() => void} cleanup
 */
export function attachSmoothScroll(scroller, { lambda = 4.5 } = {}) {
  if (typeof window === 'undefined' || !scroller) return () => {}
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const isWindow =
    scroller === window ||
    scroller === document ||
    scroller === document.documentElement ||
    scroller === document.body

  const el = isWindow ? document.documentElement : scroller

  const maxScroll = () =>
    Math.max(0, el.scrollHeight - (isWindow ? window.innerHeight : el.clientHeight))
  const getTop = () => (isWindow ? window.scrollY : el.scrollTop)
  const setTop = (v) => {
    const top = Math.max(0, Math.min(v, maxScroll()))
    if (isWindow) window.scrollTo({ top, behavior: 'instant' })
    else el.scrollTo({ top, behavior: 'instant' })
    return top
  }

  let target = getTop()
  let current = target
  let lastWritten = target
  let rafId = 0
  let lastTime = 0

  const stop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  const tick = (now) => {
    const dt = Math.min(0.05, (now - lastTime) / 1000)
    lastTime = now

    const diff = target - current
    if (Math.abs(diff) < 0.35) {
      current = target
      lastWritten = setTop(current)
      stop()
      return
    }

    current += diff * (1 - Math.exp(-lambda * dt))
    lastWritten = setTop(current)
    rafId = requestAnimationFrame(tick)
  }

  const onWheel = (e) => {
    if (e.ctrlKey) return // pinch-zoom
    // Horizontal-dominant gestures (trackpad side-swipe, shift+wheel, tab strips)
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return

    let dy = e.deltaY
    if (e.deltaMode === 1) dy *= WHEEL_LINE_PX
    else if (e.deltaMode === 2) dy *= isWindow ? window.innerHeight : el.clientHeight

    if (findNestedScrollable(e.target, dy, el)) return

    e.preventDefault()

    // Re-anchor to the real position when a glide starts from idle so a
    // stale target from a previous glide never causes a jump.
    if (rafId === 0) {
      current = getTop()
      target = current
    }

    target = Math.max(0, Math.min(target + dy * 0.75, maxScroll()))

    if (rafId === 0) {
      lastTime = performance.now()
      rafId = requestAnimationFrame(tick)
    }
  }

  // Resync when anything other than our own writes moves the scroll position
  // (scrollbar drag, keyboard, touch momentum, scrollIntoView animation).
  const onScroll = () => {
    const top = getTop()
    if (Math.abs(top - lastWritten) > 1.5) {
      target = top
      current = top
      lastWritten = top
    }
  }

  const onResize = () => {
    target = Math.min(target, maxScroll())
  }

  const listenerTarget = isWindow ? window : el
  listenerTarget.addEventListener('wheel', onWheel, { passive: false })
  listenerTarget.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })

  return () => {
    stop()
    listenerTarget.removeEventListener('wheel', onWheel)
    listenerTarget.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
  }
}
