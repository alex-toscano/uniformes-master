'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function AjustesSeguridadPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Form State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Status Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(prof)
    setLoading(false)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    if (newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'La nueva contraseña debe tener como mínimo 6 caracteres.' })
      return
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Las contraseñas no coinciden. Verifícalas e inténtalo de nuevo.' })
      return
    }

    try {
      setSubmitting(true)

      // Llamamos a la API admin/users con la acción change_password
      // Esto actualiza la contraseña en Supabase Auth Y además guarda la clave en user_metadata.assigned_password
      // para que el Super Administrador tenga visibilidad inmediata y pueda asistirlo si la pierde.
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          userId: user.id,
          password: newPassword
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar la contraseña')
      }

      setFeedback({
        type: 'success',
        message: '¡Tu contraseña ha sido actualizada con éxito! Se ha sincronizado de manera segura en el sistema.'
      })
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Ocurrió un error al cambiar la contraseña. Inténtalo de nuevo.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*'
    let pass = ''
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(pass)
    setConfirmPassword(pass)
    setShowPassword(true)
  }

  const getRoleBadge = (roleName: string) => {
    switch (roleName) {
      case 'super_admin':
        return { label: '👑 Super Administrador', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' }
      case 'admin':
        return { label: '🛡️ Administrador (Gerente)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' }
      case 'disenadora':
        return { label: '🎨 Diseñadora / Arte', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' }
      case 'produccion':
        return { label: '✂️ Producción / Taller', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' }
      default:
        return { label: '💼 Asesor Comercial / Ventas', color: 'var(--brand-primary)', bg: 'rgba(212, 255, 0, 0.15)' }
    }
  }

  if (loading) {
    return (
      <div style={{ color: 'white', padding: '4rem 2rem', textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.6)' }}>Cargando ajustes de tu cuenta...</p>
      </div>
    )
  }

  const role = profile?.role || user?.user_metadata?.role || 'vendedor'
  const roleInfo = getRoleBadge(role)
  const fullName = profile?.full_name || user?.user_metadata?.full_name || 'Colaborador'

  return (
    <div className="ajustes-container">
      {/* HEADER */}
      <div className="ajustes-header">
        <div className="header-badge">
          ⚙️ MI CUENTA Y SEGURIDAD
        </div>
        <h1>Ajustes de <span className="text-primary">Seguridad y Acceso</span></h1>
        <p>Actualiza tu contraseña de ingreso de forma segura. El Super Administrador mantendrá visibilidad de respaldo en caso de olvido o pérdida de credenciales.</p>
      </div>

      <div className="ajustes-grid">
        {/* TARJETA 1: INFORMACIÓN DEL USUARIO */}
        <div className="card profile-card">
          <div className="profile-header">
            <div className="profile-avatar" style={{ borderColor: roleInfo.color, color: roleInfo.color, background: roleInfo.bg }}>
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2>{fullName}</h2>
              <div className="role-badge" style={{ color: roleInfo.color, background: roleInfo.bg, borderColor: `${roleInfo.color}40` }}>
                {roleInfo.label}
              </div>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-row">
              <span className="detail-label">Correo Electrónico:</span>
              <span className="detail-value">{user?.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">ID de Usuario:</span>
              <span className="detail-value font-mono">{user?.id?.slice(0, 16)}...</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Último Inicio de Sesión:</span>
              <span className="detail-value">
                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('es-CO') : 'Sesión activa actual'}
              </span>
            </div>
          </div>

          <div className="security-notice">
            <div className="notice-icon">🛡️</div>
            <div>
              <strong>Políticas de Acceso y Respaldo</strong>
              <p>Por políticas operativas de la empresa, las credenciales asignadas son visibles exclusivamente para la Super Administración para garantizar la continuidad del negocio y asistencia técnica inmediata.</p>
            </div>
          </div>
        </div>

        {/* TARJETA 2: FORMULARIO DE CAMBIO DE CONTRASEÑA */}
        <div className="card form-card">
          <div className="form-card-header">
            <h3>🔑 Cambiar Contraseña de Ingreso</h3>
            <button 
              type="button"
              onClick={generateStrongPassword}
              className="btn-auto-pass"
              title="Generar una contraseña aleatoria y segura"
            >
              🎲 Sugerir Contraseña
            </button>
          </div>

          {feedback && (
            <div className={`feedback-alert ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}>
              <span>{feedback.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="password-form">
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Nueva Contraseña</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn-toggle-eye"
                >
                  {showPassword ? '🙈 Ocultar' : '👁️ Mostrar'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Confirmar Nueva Contraseña</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Vuelve a escribir la nueva contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="pass-guidelines">
              <span>Recomendación: Combina letras mayúsculas, minúsculas y números para mayor seguridad.</span>
            </div>

            <button 
              type="submit" 
              className="btn-submit-pass"
              disabled={submitting}
            >
              {submitting ? 'Guardando cambios...' : '🔒 Actualizar Contraseña'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .ajustes-container {
          padding-bottom: 3rem;
          max-width: 1100px;
          margin: 0 auto;
        }

        .header-badge {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 900;
          color: var(--brand-primary);
          background: rgba(212, 255, 0, 0.1);
          border: 1px solid rgba(212, 255, 0, 0.25);
          padding: 0.25rem 0.6rem;
          border-radius: 4px;
          margin-bottom: 0.5rem;
          letter-spacing: 0.8px;
        }

        .ajustes-header {
          margin-bottom: 2rem;
        }
        .ajustes-header h1 {
          font-size: 2rem;
          font-weight: 900;
          margin: 0;
          color: white;
        }
        .ajustes-header p {
          color: rgba(255, 255, 255, 0.6);
          margin: 0.5rem 0 0 0;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        .text-primary {
          color: var(--brand-primary);
        }

        .ajustes-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 1.8rem;
          align-items: start;
        }

        .card {
          background: #111;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 1.8rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .profile-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          font-weight: 900;
        }
        .profile-header h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: white;
          margin: 0 0 0.4rem 0;
        }
        .role-badge {
          display: inline-flex;
          align-items: center;
          font-size: 0.78rem;
          font-weight: 800;
          padding: 0.3rem 0.65rem;
          border-radius: 999px;
          border: 1px solid;
        }

        .profile-details {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          margin: 1.5rem 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.88rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .detail-label {
          color: rgba(255, 255, 255, 0.5);
        }
        .detail-value {
          color: white;
          font-weight: 600;
        }
        .font-mono {
          font-family: monospace;
          color: rgba(255, 255, 255, 0.7);
        }

        .security-notice {
          background: rgba(56, 189, 248, 0.06);
          border: 1px solid rgba(56, 189, 248, 0.2);
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          gap: 0.8rem;
          align-items: flex-start;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.4;
        }
        .notice-icon {
          font-size: 1.4rem;
        }
        .security-notice strong {
          color: #38bdf8;
          display: block;
          margin-bottom: 0.2rem;
        }
        .security-notice p {
          margin: 0;
        }

        .form-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 0.8rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .form-card-header h3 {
          font-size: 1.1rem;
          font-weight: 800;
          color: white;
          margin: 0;
        }

        .btn-auto-pass {
          background: rgba(212, 255, 0, 0.12);
          color: var(--brand-primary);
          border: 1px solid rgba(212, 255, 0, 0.3);
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.35rem 0.65rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-auto-pass:hover {
          background: var(--brand-primary);
          color: black;
        }

        .feedback-alert {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.85rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 1.2rem;
          line-height: 1.4;
        }
        .feedback-success {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #10b981;
        }
        .feedback-error {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #ef4444;
        }

        .password-form {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .form-group label {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.7);
        }
        .form-group input {
          background: #1c1c1c;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          padding: 0.9rem;
          border-radius: 6px;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }
        .form-group input:focus {
          outline: none;
          border-color: var(--brand-primary);
        }

        .btn-toggle-eye {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-toggle-eye:hover {
          color: white;
        }

        .pass-guidelines {
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.45);
          margin-top: -0.4rem;
        }

        .btn-submit-pass {
          background: var(--brand-primary);
          color: black;
          font-weight: 900;
          padding: 0.95rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 0.5rem;
          transition: transform 0.15s, background 0.15s;
        }
        .btn-submit-pass:hover:not(:disabled) {
          background: #fde047;
          transform: translateY(-2px);
        }
        .btn-submit-pass:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner {
          width: 38px;
          height: 38px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: var(--brand-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 820px) {
          .ajustes-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}