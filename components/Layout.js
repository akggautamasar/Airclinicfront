import { useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '../lib/supabase'

const NAV = [
  { href: '/dashboard',     icon: '⬡', label: 'Dashboard' },
  { href: '/appointments',  icon: '📅', label: 'Appointments' },
  { href: '/patients',      icon: '👥', label: 'Patients' },
  { href: '/prescriptions', icon: '💊', label: 'Prescriptions' },
  { href: '/billing',       icon: '🧾', label: 'Billing' },
  { href: '/profile',       icon: '⚙️', label: 'Settings' },
]

export default function Layout({ children }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('clinic_token')
    router.push('/login')
  }

  return (
    <div className="layout">
      {/* Mobile menu button */}
      <button className="mobile-menu-btn" onClick={() => setOpen(!open)}>
        <span style={{ fontSize: 20 }}>{open ? '✕' : '☰'}</span>
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="nav-logo">
          <div className="nav-logo-text">✚ ClinicOS</div>
          <div className="nav-logo-sub">Practice Management</div>
        </div>

        <nav>
          {NAV.map(n => (
            <div
              key={n.href}
              className={`nav-item ${router.pathname === n.href ? 'active' : ''}`}
              onClick={() => { router.push(n.href); setOpen(false) }}
            >
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </div>
          ))}
        </nav>

        <div className="nav-bottom">
          <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main" onClick={() => setOpen(false)}>
        {children}
      </main>
    </div>
  )
}
