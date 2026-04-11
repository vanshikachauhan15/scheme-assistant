import { NavLink, Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

const nav = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/chatbot', label: 'Chatbot' },
  { to: '/features', label: 'Features' },
]

function Layout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="site">
      <a href="#main" className="site-skip">
        Skip to content
      </a>

      <header className="site-header">
        <NavLink to="/" className="site-logo-link" end onClick={() => setOpen(false)}>
          <span className="site-logo-mark" aria-hidden>
            SA
          </span>
          <span className="site-logo-text">Scheme Assistant</span>
        </NavLink>

        <button
          type="button"
          className="site-nav-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
          <span className="sr-only">Menu</span>
        </button>

        <nav id="site-nav" className={`site-nav ${open ? 'is-open' : ''}`}>
          <ul>
            {nav.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main" className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <p className="site-footer-brand">Scheme Assistant</p>
          <p className="site-footer-note">
            Guidance on government schemes — always verify details on official sources.
          </p>
          <p className="site-footer-copy">© {new Date().getFullYear()} Scheme Assistant</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
