'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="dashboard-layout">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <span className="font-black text-xl text-white">ERP <span className="text-[var(--brand-primary)]">MASTER</span></span>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          Cerrar Sesión
        </button>
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
      `}</style>
    </div>
  )
}
