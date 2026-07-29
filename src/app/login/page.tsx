'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import InstallPrompt from '@/components/InstallPrompt'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Credenciales inválidas. Verifica tu correo y contraseña.')
      setLoading(false)
      return
    }

    // El middleware interceptará esta redirección y la llevará al dashboard correcto según el rol
    router.push('/dashboard')
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <InstallPrompt />
        <div className="login-header">
          <h2>ERP <span className="text-primary">MASTER</span></h2>
          <p>Acceso exclusivo para personal autorizado</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@uniformesmaster.com"
            />
          </div>
          
          <div className="form-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #050505;
          padding: 2rem;
        }
        .login-box {
          background: #0a0a0a;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 3rem;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        .login-header h2 {
          font-size: 2rem;
          font-weight: 900;
          color: #fff;
          margin-bottom: 0.5rem;
        }
        .login-header p {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9rem;
        }
        .text-primary {
          color: var(--brand-primary);
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .form-group input {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 1rem;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        .form-group input:focus {
          outline: none;
          border-color: var(--brand-primary);
        }
        .btn-login {
          background: var(--brand-primary);
          color: #000;
          font-weight: 800;
          padding: 1rem;
          border-radius: 6px;
          border: none;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
          margin-top: 1rem;
        }
        .btn-login:hover:not(:disabled) {
          transform: translateY(-2px);
          background: #e1ff00;
        }
        .btn-login:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .error-message {
          background: rgba(255, 50, 50, 0.1);
          color: #ff5555;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid rgba(255, 50, 50, 0.2);
          font-size: 0.9rem;
          text-align: center;
        }
      `}</style>
    </div>
  )
}
