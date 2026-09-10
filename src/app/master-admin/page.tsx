'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MasterAdminPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(false)
  const router = useRouter()

  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [form, setForm] = useState({ email: '', password: '', fullName: '', role: 'vendedor' })

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const superAdmins = ['superadmin@mcm.com', 'developer@uniformesmaster.com', 'admin@uniformesmaster.com']
    if (!user || !superAdmins.includes(user.email || '')) {
      setAuthError(true)
      return
    }
    loadUsers()
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.users) setUsers(data.users)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const action = editingUser ? 'update' : 'create'
    const payload = { ...form, action, userId: editingUser?.id }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setShowModal(false)
        setEditingUser(null)
        loadUsers()
      } else { alert('Error al guardar el usuario.') }
    } catch (e) { alert('Error de conexión.') }
    setLoading(false)
  }

  const handleDelete = async (id: string, email: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar a ${email}?`)) {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', userId: id })
        })
        if (res.ok) loadUsers()
        else alert('No se pudo eliminar.')
      } catch(e) { alert('Error de red.') }
      setLoading(false)
    }
  }

  if (authError) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'white' }}>
        <h2>⛔ ACCESO DENEGADO ⛔</h2>
        <p>Esta es un área restringida solo para los Super Administradores fundadores.</p>
        <Link href='/dashboard' style={{ color: 'var(--brand-primary)' }}>Volver al sistema</Link>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--brand-primary)', borderBottom: '2px solid var(--brand-primary)', display: 'inline-block' }}>👑 PANEL MAESTRO DE USUARIOS</h1>
        <button onClick={() => { setEditingUser(null); setForm({ email: '', password: '', fullName: '', role: 'vendedor' }); setShowModal(true) }} style={{ padding: '0.8rem 1.5rem', background: 'var(--brand-primary)', color: 'black', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>+ Nuevo Usuario</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <Link href='/dashboard' style={{ padding: '0.5rem 1rem', background: '#333', color: 'white', borderRadius: '4px', textDecoration: 'none' }}>← Volver al Dashboard</Link>
      </div>

      {loading && !showModal ? <p>Cargando usuarios...</p> : (
        <div style={{ background: '#1e1e1e', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#111', color: 'gray' }}>
                <th style={{ padding: '1rem' }}>Usuario / Email</th>
                <th style={{ padding: '1rem' }}>Rol</th>
                <th style={{ padding: '1rem' }}>Última vez activo</th>
                <th style={{ padding: '1rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '1rem' }}>
                    <strong>{u.user_metadata?.full_name || 'Sin Nombre'}</strong><br/>
                    <span style={{ fontSize: '0.8rem', color: 'gray' }}>{u.email}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ background: u.user_metadata?.role === 'admin' ? '#3b82f6' : '#22c55e', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                      {u.user_metadata?.role?.toUpperCase() || 'VENDEDOR'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'gray', fontSize: '0.9rem' }}>
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('es-CO') : 'Nunca'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button onClick={() => {
                      setEditingUser(u)
                      setForm({ email: u.email, password: '', fullName: u.user_metadata?.full_name || '', role: u.user_metadata?.role || 'vendedor' })
                      setShowModal(true)
                    }} style={{ background: '#4b5563', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px', marginRight: '0.5rem', cursor: 'pointer', border: 'none' }}>Editar</button>
                    
                    <button onClick={() => handleDelete(u.id, u.email)} style={{ background: '#ef4444', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', border: 'none' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#222', padding: '2rem', borderRadius: '8px', width: '400px' }}>
            <h2>{editingUser ? 'Editar Usuario' : 'Crear Usuario'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre Completo</label>
                <input required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: '#333', color: 'white', border: '1px solid #444', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Correo (Email)</label>
                <input type="email" required disabled={!!editingUser} value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: editingUser ? '#111' : '#333', color: 'white', border: '1px solid #444', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>{editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}</label>
                <input type="password" required={!editingUser} minLength={6} value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: '#333', color: 'white', border: '1px solid #444', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Rol en el sistema</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: '#333', color: 'white', border: '1px solid #444', borderRadius: '4px' }}>
                  <option value="vendedor">Vendedor (Solo Ventas)</option>
                  <option value="produccion">Producción (Taller)</option>
                  <option value="admin">Administrador (Total)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" disabled={loading} style={{ flex: 1, padding: '1rem', background: 'var(--brand-primary)', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{loading ? 'Guardando...' : 'Guardar'}</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '1rem', background: '#444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
