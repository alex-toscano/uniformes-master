'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      // TODO: Reemplazar por tu correo real de administrador
      if (data.user?.email === 'tucorreo@admin.com' || data.user?.email?.includes('admin')) {
        setIsAdmin(true)
      } else {
        // En un caso real, por si lo necesitas forzar, podemos dejarlo en true para que lo veas:
        setIsAdmin(true) // Temporalmente true para que tú (el developer/dueño) lo puedas ver sin cambiar el código
      }
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="dashboard-layout">
      <nav className="dashboard-nav">
        <div className="nav-mobile-header">
          <div className="nav-brand">
            <span className="font-black text-xl text-white">ERP <span className="text-[var(--brand-primary)]">MASTER</span></span>
          </div>
          <button className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
        
        <div className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
          <div className="nav-links">
            <a href="/dashboard/vendedor" className="nav-link" onClick={() => setIsMenuOpen(false)}>Tablero Kanban</a>
            <a href="/dashboard/clientes" className="nav-link" onClick={() => setIsMenuOpen(false)}>CRM Clientes</a>
            {isAdmin && <a href="/dashboard/finanzas" className="nav-link admin-only" onClick={() => setIsMenuOpen(false)}>Finanzas</a>}
          </div>

          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </nav>
      <main className="dashboard-content">
        {children}
      </main>

      <style>{`
        .dashboard-layout {
          min-height: 100vh;
          background: #050505;
          color: white;
        }
        .dashboard-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: #0a0a0a;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .nav-links {
          display: flex;
          gap: 2rem;
          align-items: center;
        }
        .nav-link {
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: color 0.2s;
        }
        .nav-link:hover {
          color: var(--brand-primary);
        }
        .font-black { font-weight: 900; }
        .text-xl { font-size: 1.25rem; }
        .text-white { color: #fff; }
        .dashboard-content {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        .btn-logout {
          background: transparent;
          color: #ff4444;
          border: 1px solid rgba(255, 68, 68, 0.3);
          padding: 0.5rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.2s;
        }
        .btn-logout:hover {
          background: rgba(255, 68, 68, 0.1);
          border-color: #ff4444;
        }

        .hamburger {
          display: none;
          background: transparent;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
        }

        .nav-menu {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .nav-mobile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        @media (max-width: 768px) {
          .hamburger {
            display: block;
          }
          .dashboard-nav {
            flex-direction: column;
            padding: 1rem;
          }
          .nav-menu {
            display: none;
            width: 100%;
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
            margin-top: 1rem;
          }
          .nav-menu.open {
            display: flex;
            animation: fadeIn 0.3s ease;
          }
          .nav-links {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }
          .nav-link {
            display: block;
            padding: 0.8rem;
            background: rgba(255,255,255,0.05);
            border-radius: 6px;
            text-align: center;
          }
          .btn-logout {
            width: 100%;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
