import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './firebase'
import App from './App.jsx'

// Suppress Three.js r183+ deprecation warning emitted internally by @react-three/fiber
const originalWarn = console.warn
console.warn = (...args) => {
  if (
    args.some(
      (arg) =>
        typeof arg === 'string' &&
        arg.includes('THREE.Clock: This module has been deprecated'),
    )
  ) {
    return
  }
  originalWarn(...args)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
