import { useEffect } from 'react'
import Navbar from './Navbar'
import './RegisterPage.css'

export default function RegisterPage({ onNavigate }) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="register-wrapper">
      {/* Unified Global Navbar */}
      <Navbar currentPage="register" onNavigate={onNavigate} />

      {/* Fullscreen embed of Sarthak branch registration experience */}
      <div className="register-iframe-container">
        <iframe
          src="/register/index.html"
          title="Hack Vally Registration"
          className="register-iframe"
          allow="clipboard-write; autoplay"
        />
      </div>
    </div>
  )
}
