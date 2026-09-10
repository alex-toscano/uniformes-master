'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      setUserEmail(data.user.email || '')
      
      const isSuper = data.user.email === 'superadmin@mcm.com'
      if (isSuper) {
        setIsSuperAdmin(true)
        setIsAdmin(true)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'super_admin') {
        setIsSuperAdmin(true)
        setIsAdmin(true)
      } else if (profile?.role === 'admin' || data.user.email?.includes('admin')) {
        setIsAdmin(true)
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
            {isSuperAdmin && <span className="superadmin-badge">SUPER ADMIN</span>}
            {!isSuperAdmin && isAdmin && <span className="gerente-badge">GERENTE</span>}
          </div>
          <button className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
        
        <div className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
          <div className="nav-links">
            {isSuperAdmin ? (
              <>
                <a href="/dashboard/super-admin" className="nav-link super-link" onClick={() => setIsMenuOpen(false)}>
                  👥 Personal y Accesos
                </a>
                <a href="/dashboard/finanzas" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  📊 Finanzas
                </a>
                <a href="/dashboard/admin" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  📦 Vista Pedidos
                </a>
                <a href="/dashboard/ajustes" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  ⚙️ Ajustes
                </a>
              </>
            ) : isAdmin ? (
              <>
                <a href="/dashboard/admin" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  🏭 Producción
                </a>
                <a href="/dashboard/clientes" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  👥 CRM Clientes
                </a>
                <a href="/dashboard/finanzas" className="nav-link admin-only" onClick={() => setIsMenuOpen(false)}>
                  💰 Finanzas
                </a>
                <a href="/dashboard/ajustes" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  ⚙️ Ajustes
                </a>
              </>
            ) : (
              <>
                <a href="/dashboard/vendedor" className="nav-link" onClick={() => setIsMenuOpen(false)}>Tablero</a>
                <a href="/dashboard/clientes" className="nav-link" onClick={() => setIsMenuOpen(false)}>CRM Clientes</a>
                <a href="/dashboard/ajustes" className="nav-link" onClick={() => setIsMenuOpen(false)}>⚙️ Ajustes</a>
              </>
            )}
          </div>

          <div className="user-section">
            <span className="user-email">{userEmail}</span>
            <button onClick={handleLogout} className="btn-logout">
              Cerrar Sesión
            </button>
          </div>
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
        .superadmin-badge {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #000;
          font-weight: 900;
          font-size: 0.65rem;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          margin-left: 0.8rem;
          letter-spacing: 0.5px;
          vertical-align: middle;
          text-transform: uppercase;
        }
        .gerente-badge {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          font-weight: 900;
          font-size: 0.65rem;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          margin-left: 0.8rem;
          letter-spacing: 0.5px;
          vertical-align: middle;
          text-transform: uppercase;
        }
        .super-link {
          color: #f59e0b !important;
          border-bottom: 2px solid #f59e0b;
          padding-bottom: 0.2rem;
        }
        .user-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .user-email {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.85rem;
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
