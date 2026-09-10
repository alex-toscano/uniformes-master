'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface PersonnelUser {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
  last_sign_in_at: string | null
  banned_until: string | null
  is_banned: boolean
}

const ROLES_CONFIG: Record<string, { label: string; badgeColor: string; bg: string; icon: string; desc: string }> = {
  vendedor: {
    label: 'Vendedor / Comercial',
    badgeColor: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    icon: '💼',
    desc: 'Atención al cliente, catálogo y creación de pedidos.'
  },
  disenadora: {
    label: 'Diseñadora / Arte',
    badgeColor: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    icon: '🎨',
    desc: 'Bocetos, arte gráfico, patronaje y aprobación de diseños.'
  },
  produccion: {
    label: 'Producción / Taller',
    badgeColor: '#f97316',
    bg: 'rgba(249, 115, 22, 0.12)',
    icon: '✂️',
    desc: 'Corte, confección, ensamblado y avance de estados en taller.'
  },
  admin: {
    label: 'Administrador (Gerente)',
    badgeColor: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    icon: '🛡️',
    desc: 'Supervisión de pedidos, clientes y control financiero.'
  },
  super_admin: {
    label: 'Super Administrador',
    badgeColor: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    icon: '👑',
    desc: 'Control supremo de personal, accesos y seguridad del ERP.'
  }
}

export default function SuperAdminDashboard() {
  const [users, setUsers] = useState<PersonnelUser[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<PersonnelUser | null>(null)

  // Form states
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'vendedor'
  })

  const [editForm, setEditForm] = useState({
    fullName: '',
    role: 'vendedor'
  })

  const [newPassword, setNewPassword] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 4000)
  }

  const loadPersonnel = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.users) {
        setUsers(data.users)
      } else if (data.error) {
        showToast(data.error, 'error')
      }
    } catch (err) {
      showToast('Error al conectar con el servidor', 'error')
    }
    setLoading(false)
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id)
      }
    })
    loadPersonnel()
  }, [])

  // Create Personnel
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          fullName: createForm.fullName.trim(),
          email: createForm.email.trim().toLowerCase(),
          password: createForm.password,
          role: createForm.role
        })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`Personal "${createForm.fullName}" creado exitosamente`)
        setShowCreateModal(false)
        setCreateForm({ fullName: '', email: '', password: '', role: 'vendedor' })
        loadPersonnel()
      } else {
        showToast(data.error || 'Error al crear usuario', 'error')
      }
    } catch (e) {
      showToast('Error de conexión', 'error')
    }
    setActionLoading(false)
  }

  // Edit Personnel
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          userId: selectedUser.id,
          fullName: editForm.fullName.trim(),
          role: editForm.role
        })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`Datos de "${editForm.fullName}" actualizados`)
        setShowEditModal(false)
        setSelectedUser(null)
        loadPersonnel()
      } else {
        showToast(data.error || 'Error al actualizar', 'error')
      }
    } catch (e) {
      showToast('Error de red', 'error')
    }
    setActionLoading(false)
  }

  // Toggle Block (Ban / Unban)
  const handleToggleBlock = async (user: PersonnelUser) => {
    if (user.id === currentUserId) {
      alert('No puedes bloquear tu propia cuenta de Super Administrador.')
      return
    }

    const isBlocking = !user.is_banned
    const confirmText = isBlocking
      ? `¿Estás seguro de BLOQUEAR el acceso a ${user.full_name || user.email}?\n\nEl colaborador no podrá ingresar al ERP ni consultar datos del negocio (ideal para bajas o renuncias).`
      : `¿Deseas REACTIVAR el acceso a ${user.full_name || user.email}?`

    if (!confirm(confirmText)) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_block',
          userId: user.id
        })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || (isBlocking ? 'Acceso bloqueado' : 'Acceso reactivado'))
        loadPersonnel()
      } else {
        showToast(data.error || 'Error al cambiar estado de acceso', 'error')
      }
    } catch (e) {
      showToast('Error de red', 'error')
    }
    setActionLoading(false)
  }

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !newPassword) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          userId: selectedUser.id,
          password: newPassword
        })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`Contraseña de "${selectedUser.full_name}" restablecida con éxito`)
        setShowPasswordModal(false)
        setSelectedUser(null)
        setNewPassword('')
      } else {
        showToast(data.error || 'Error al cambiar contraseña', 'error')
      }
    } catch (e) {
      showToast('Error de red', 'error')
    }
    setActionLoading(false)
  }

  // Delete User
  const handleDeleteUser = async (user: PersonnelUser) => {
    if (user.id === currentUserId) {
      alert('No puedes eliminar tu propia cuenta de Super Administrador.')
      return
    }

    const confirmText = `⚠️ ATENCIÓN: ¿Seguro que deseas ELIMINAR DEFINITIVAMENTE la cuenta de ${user.full_name} (${user.email})?\n\nSi solo renunció o se fue, te recomendamos usar la opción "Bloquear Acceso" en lugar de eliminar.`
    if (!confirm(confirmText)) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          userId: user.id
        })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`Usuario "${user.full_name}" eliminado`)
        loadPersonnel()
      } else {
        showToast(data.error || 'No se pudo eliminar el usuario', 'error')
      }
    } catch (e) {
      showToast('Error de red', 'error')
    }
    setActionLoading(false)
  }

  // Metrics
  const totalCount = users.length
  const activeCount = users.filter(u => !u.is_banned).length
  const blockedCount = users.filter(u => u.is_banned).length
  const vendedoresCount = users.filter(u => u.role === 'vendedor').length
  const disenadorasCount = users.filter(u => u.role === 'disenadora').length
  const produccionCount = users.filter(u => u.role === 'produccion').length
  const adminsCount = users.filter(u => u.role === 'admin').length

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ROLES_CONFIG[u.role]?.label || u.role).toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === 'all' || u.role === roleFilter

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? !u.is_banned
        : u.is_banned

    return matchesSearch && matchesRole && matchesStatus
  })

  return (
    <div className="superadmin-container">
      {/* Toast */}
      {toastMessage && (
        <div className={`toast-notification ${toastMessage.type}`}>
          {toastMessage.type === 'success' ? '✅ ' : '❌ '}
          {toastMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="header-box">
        <div>
          <div className="crown-badge">
            <span>👑 MÓDULO DE GESTIÓN DE PERSONAL Y ACCESOS</span>
          </div>
          <h1 className="page-title">
            Directorio del Personal <span className="highlight-text">ERP Master</span>
          </h1>
          <p className="page-subtitle">
            Crea cuentas de acceso para el equipo de trabajo (Vendedores, Diseñadoras, Taller de Producción y Administradores).
            Si algún colaborador renuncia o es dado de baja, puedes <strong>bloquear su acceso inmediatamente</strong> con un solo clic.
          </p>
        </div>

        <button
          className="btn-create-user"
          onClick={() => {
            setCreateForm({ fullName: '', email: '', password: '', role: 'vendedor' })
            setShowCreateModal(true)
          }}
        >
          <span className="plus-icon">+</span> Crear Nuevo Colaborador
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
            👥
          </div>
          <div>
            <div className="kpi-label">Total Colaboradores</div>
            <div className="kpi-value">{totalCount}</div>
            <div className="kpi-hint">Cuentas registradas</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
            🟢
          </div>
          <div>
            <div className="kpi-label">Accesos Activos</div>
            <div className="kpi-value" style={{ color: '#10b981' }}>{activeCount}</div>
            <div className="kpi-hint">Personal con ingreso al sistema</div>
          </div>
        </div>

        <div className="kpi-card" style={blockedCount > 0 ? { borderColor: 'rgba(239, 68, 68, 0.4)' } : {}}>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
            🔒
          </div>
          <div>
            <div className="kpi-label">Bloqueados / Renuncias</div>
            <div className="kpi-value" style={{ color: '#ef4444' }}>{blockedCount}</div>
            <div className="kpi-hint">Acceso revocado por seguridad</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
            🏷️
          </div>
          <div style={{ flex: 1 }}>
            <div className="kpi-label">Cargos Activos</div>
            <div className="roles-pill-row">
              <span title="Vendedores">💼 {vendedoresCount}</span>
              <span title="Diseñadoras">🎨 {disenadorasCount}</span>
              <span title="Producción">✂️ {produccionCount}</span>
              <span title="Administradores">🛡️ {adminsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre, correo o cargo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>

        <div className="filter-group">
          <label>Cargo:</label>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los cargos</option>
            <option value="vendedor">💼 Vendedor / Comercial</option>
            <option value="disenadora">🎨 Diseñadora / Arte</option>
            <option value="produccion">✂️ Producción / Taller</option>
            <option value="admin">🛡️ Administrador (Gerente)</option>
            <option value="super_admin">👑 Super Administrador</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Estado:</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los estados</option>
            <option value="active">🟢 Solo Activos</option>
            <option value="blocked">🔴 Solo Bloqueados</option>
          </select>
        </div>
      </div>

      {/* Personnel Table */}
      <div className="table-container">
        {loading ? (
          <div className="empty-state">
            <div className="spinner"></div>
            <p>Cargando información del personal...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <p className="empty-title">No se encontraron colaboradores</p>
            <p className="empty-desc">Prueba cambiando los filtros de búsqueda o registra un nuevo usuario.</p>
          </div>
        ) : (
          <table className="personnel-table">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Cargo / Rol</th>
                <th>Estado de Acceso</th>
                <th>Último Ingreso</th>
                <th style={{ textAlign: 'right' }}>Acciones de Control</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const roleConfig = ROLES_CONFIG[user.role] || {
                  label: user.role,
                  badgeColor: '#9ca3af',
                  bg: 'rgba(156, 163, 175, 0.1)',
                  icon: '👤',
                  desc: 'Usuario del sistema'
                }
                const isCurrentUser = user.id === currentUserId
                const isBanned = user.is_banned

                return (
                  <tr key={user.id} className={isBanned ? 'row-banned' : ''}>
                    {/* User Info */}
                    <td>
                      <div className="user-cell">
                        <div
                          className="user-avatar"
                          style={{
                            borderColor: roleConfig.badgeColor,
                            background: roleConfig.bg,
                            color: roleConfig.badgeColor
                          }}
                        >
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="user-name">
                            {user.full_name || 'Sin Nombre Asignado'}
                            {isCurrentUser && <span className="current-user-tag">TÚ (Super Admin)</span>}
                          </div>
                          <div className="user-email-text">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td>
                      <div
                        className="role-badge"
                        style={{
                          color: roleConfig.badgeColor,
                          background: roleConfig.bg,
                          border: `1px solid ${roleConfig.badgeColor}40`
                        }}
                      >
                        <span style={{ marginRight: '0.4rem' }}>{roleConfig.icon}</span>
                        {roleConfig.label}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      {isBanned ? (
                        <div className="status-badge status-blocked">
                          <span className="status-dot dot-red"></span>
                          <span>BLOQUEADO (Sin Acceso)</span>
                        </div>
                      ) : (
                        <div className="status-badge status-active">
                          <span className="status-dot dot-green"></span>
                          <span>ACTIVO</span>
                        </div>
                      )}
                    </td>

                    {/* Last Login */}
                    <td>
                      <div className="time-text">
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleString('es-CO', {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })
                          : 'Nunca ha ingresado'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="action-buttons-wrap">
                        {/* Block / Unblock */}
                        {!isCurrentUser ? (
                          <button
                            onClick={() => handleToggleBlock(user)}
                            className={`btn-action ${isBanned ? 'btn-unblock' : 'btn-block'}`}
                            title={isBanned ? 'Permitir acceso al sistema' : 'Bloquear acceso de inmediato'}
                          >
                            {isBanned ? '🔓 Desbloquear' : '🔒 Bloquear'}
                          </button>
                        ) : null}

                        {/* Edit Role / Name */}
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setEditForm({ fullName: user.full_name, role: user.role })
                            setShowEditModal(true)
                          }}
                          className="btn-action btn-edit"
                          title="Editar nombre o cargo"
                        >
                          ✏️ Editar
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setNewPassword('')
                            setShowPasswordModal(true)
                          }}
                          className="btn-action btn-key"
                          title="Asignar nueva contraseña"
                        >
                          🔑 Clave
                        </button>

                        {/* Delete User */}
                        {!isCurrentUser && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="btn-action btn-delete"
                            title="Eliminar usuario definitivamente"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL: CREATE PERSONNEL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowCreateModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Crear Nuevo Miembro del Personal</h2>
              <button
                className="btn-close-modal"
                onClick={() => setShowCreateModal(false)}
                disabled={actionLoading}
              >
                ✕
              </button>
            </div>

            <p className="modal-intro">
              Registra los datos de acceso para el colaborador. Se le asignará automáticamente el rol correspondiente y podrá ingresar de inmediato.
            </p>

            <form onSubmit={handleCreateUser} className="modal-form">
              <div className="form-group">
                <label>Nombre y Apellido</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Gómez"
                  value={createForm.fullName}
                  onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Correo Electrónico (Usuario de acceso)</label>
                <input
                  type="email"
                  required
                  placeholder="Ej: laura.diseno@mcm.com"
                  value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Contraseña Inicial</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Cargo / Rol en el Sistema</label>
                <select
                  value={createForm.role}
                  onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                >
                  <option value="vendedor">💼 Vendedor / Comercial (Ventas y Clientes)</option>
                  <option value="disenadora">🎨 Diseñadora / Arte (Bocetos y Diseños)</option>
                  <option value="produccion">✂️ Producción / Taller (Corte y Confección)</option>
                  <option value="admin">🛡️ Administrador (Gestión y Finanzas)</option>
                  <option value="super_admin">👑 Super Administrador (Control Total)</option>
                </select>
                <div className="role-preview-tip">
                  {ROLES_CONFIG[createForm.role]?.desc}
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-submit" disabled={actionLoading}>
                  {actionLoading ? 'Guardando...' : 'Crear Colaborador'}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PERSONNEL */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowEditModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Editar Colaborador</h2>
              <button
                className="btn-close-modal"
                onClick={() => setShowEditModal(false)}
                disabled={actionLoading}
              >
                ✕
              </button>
            </div>

            <p className="modal-intro">
              Actualizando los datos de <strong>{selectedUser.email}</strong>.
            </p>

            <form onSubmit={handleEditUser} className="modal-form">
              <div className="form-group">
                <label>Nombre y Apellido</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Cargo / Rol en el Sistema</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="vendedor">💼 Vendedor / Comercial</option>
                  <option value="disenadora">🎨 Diseñadora / Arte</option>
                  <option value="produccion">✂️ Producción / Taller</option>
                  <option value="admin">🛡️ Administrador (Gerente)</option>
                  <option value="super_admin">👑 Super Administrador</option>
                </select>
                <div className="role-preview-tip">
                  {ROLES_CONFIG[editForm.role]?.desc}
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-submit" disabled={actionLoading}>
                  {actionLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowEditModal(false)}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {showPasswordModal && selectedUser && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowPasswordModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔑 Asignar Nueva Contraseña</h2>
              <button
                className="btn-close-modal"
                onClick={() => setShowPasswordModal(false)}
                disabled={actionLoading}
              >
                ✕
              </button>
            </div>

            <p className="modal-intro">
              Ingresa la nueva contraseña para <strong>{selectedUser.full_name} ({selectedUser.email})</strong>. La contraseña se actualizará de inmediato.
            </p>

            <form onSubmit={handleChangePassword} className="modal-form">
              <div className="form-group">
                <label>Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-submit" disabled={actionLoading}>
                  {actionLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .superadmin-container {
          padding: 1rem 0;
        }

        .toast-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.95rem;
          z-index: 9999;
          box-shadow: 0 10px 30px rgba(0,0,0,0.6);
          animation: slideIn 0.3s ease;
        }
        .toast-notification.success {
          background: #064e3b;
          color: #34d399;
          border: 1px solid #059669;
        }
        .toast-notification.error {
          background: #7f1d1d;
          color: #f87171;
          border: 1px solid #dc2626;
        }

        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .header-box {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 2rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .crown-badge {
          display: inline-flex;
          align-items: center;
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 1px;
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          border: 1px solid rgba(245, 158, 11, 0.3);
          margin-bottom: 0.8rem;
        }

        .page-title {
          font-size: 2.2rem;
          font-weight: 900;
          color: #fff;
          margin: 0;
          line-height: 1.2;
        }

        .highlight-text {
          color: var(--brand-primary);
        }

        .page-subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.95rem;
          margin-top: 0.5rem;
          max-width: 800px;
          line-height: 1.5;
        }

        .btn-create-user {
          background: var(--brand-primary);
          color: #000;
          font-weight: 800;
          font-size: 0.95rem;
          padding: 0.9rem 1.8rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: transform 0.2s, background 0.2s;
          box-shadow: 0 4px 15px rgba(254, 240, 138, 0.2);
        }
        .btn-create-user:hover {
          transform: translateY(-2px);
          background: #fde047;
        }
        .plus-icon {
          font-size: 1.2rem;
          font-weight: 900;
        }

        /* KPI Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.2rem;
          margin-bottom: 2rem;
        }

        .kpi-card {
          background: #0d0d0d;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          padding: 1.4rem;
          display: flex;
          align-items: center;
          gap: 1.2rem;
          transition: border-color 0.2s;
        }
        .kpi-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }

        .kpi-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .kpi-label {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.2rem;
        }

        .kpi-value {
          font-size: 1.8rem;
          font-weight: 900;
          color: #fff;
          line-height: 1;
        }

        .kpi-hint {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 0.3rem;
        }

        .roles-pill-row {
          display: flex;
          gap: 0.6rem;
          margin-top: 0.4rem;
          font-size: 0.85rem;
          font-weight: 700;
        }
        .roles-pill-row span {
          background: rgba(255, 255, 255, 0.05);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        /* Filter Bar */
        .filter-bar {
          background: #0d0d0d;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .search-input-wrap {
          flex: 1;
          min-width: 250px;
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 1rem;
          color: rgba(255, 255, 255, 0.4);
        }
        .search-input {
          width: 100%;
          background: #161616;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 0.75rem 2.2rem 0.75rem 2.5rem;
          border-radius: 6px;
          font-size: 0.9rem;
        }
        .search-input:focus {
          outline: none;
          border-color: var(--brand-primary);
        }
        .clear-search {
          position: absolute;
          right: 0.8rem;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .filter-group label {
          font-size: 0.85rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
        }
        .filter-select {
          background: #161616;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 0.7rem 1rem;
          border-radius: 6px;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .filter-select:focus {
          outline: none;
          border-color: var(--brand-primary);
        }

        /* Table */
        .table-container {
          background: #0d0d0d;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          overflow-x: auto;
        }

        .personnel-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .personnel-table th {
          background: #121212;
          padding: 1.1rem 1.4rem;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .personnel-table td {
          padding: 1.2rem 1.4rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          vertical-align: middle;
        }
        .personnel-table tr:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        .row-banned {
          background: rgba(239, 68, 68, 0.03);
        }

        .user-cell {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .user-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1.1rem;
          border: 2px solid;
          flex-shrink: 0;
        }
        .user-name {
          font-size: 0.95rem;
          font-weight: 800;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .current-user-tag {
          background: #f59e0b;
          color: #000;
          font-size: 0.65rem;
          font-weight: 900;
          padding: 0.15rem 0.4rem;
          border-radius: 3px;
        }
        .user-email-text {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 0.15rem;
        }

        .role-badge {
          display: inline-flex;
          align-items: center;
          font-size: 0.8rem;
          font-weight: 800;
          padding: 0.35rem 0.8rem;
          border-radius: 6px;
          letter-spacing: 0.3px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.3rem 0.7rem;
          border-radius: 20px;
        }
        .status-active {
          background: rgba(16, 185, 129, 0.12);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .status-blocked {
          background: rgba(239, 68, 68, 0.12);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .dot-green {
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }
        .dot-red {
          background: #ef4444;
          box-shadow: 0 0 8px #ef4444;
        }

        .time-text {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .action-buttons-wrap {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.5rem;
        }

        .btn-action {
          padding: 0.45rem 0.85rem;
          border-radius: 5px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        .btn-block {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
        }
        .btn-block:hover {
          background: #ef4444;
          color: white;
        }

        .btn-unblock {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.3);
        }
        .btn-unblock:hover {
          background: #10b981;
          color: black;
        }

        .btn-edit {
          background: rgba(255, 255, 255, 0.05);
          color: white;
          border-color: rgba(255, 255, 255, 0.1);
        }
        .btn-edit:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .btn-key {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border-color: rgba(245, 158, 11, 0.25);
        }
        .btn-key:hover {
          background: #f59e0b;
          color: black;
        }

        .btn-delete {
          background: transparent;
          color: rgba(255, 255, 255, 0.4);
          border: none;
          padding: 0.45rem 0.6rem;
        }
        .btn-delete:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .empty-state {
          padding: 4rem 2rem;
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
        }
        .empty-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.5rem;
        }
        .empty-desc {
          font-size: 0.9rem;
        }
        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: var(--brand-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1rem auto;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          z-index: 10000;
          animation: fadeIn 0.2s ease;
        }
        .modal-card {
          background: #111;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 2.2rem;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.8rem;
        }
        .modal-header h2 {
          font-size: 1.3rem;
          font-weight: 800;
          color: #fff;
          margin: 0;
        }
        .btn-close-modal {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.4rem;
          cursor: pointer;
        }
        .btn-close-modal:hover {
          color: #fff;
        }
        .modal-intro {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .modal-form {
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
        .form-group input, .form-group select {
          background: #1c1c1c;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          padding: 0.9rem;
          border-radius: 6px;
          font-size: 0.95rem;
        }
        .form-group input:focus, .form-group select:focus {
          outline: none;
          border-color: var(--brand-primary);
        }
        .role-preview-tip {
          font-size: 0.75rem;
          color: #38bdf8;
          margin-top: 0.2rem;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        .btn-submit {
          flex: 2;
          background: var(--brand-primary);
          color: black;
          font-weight: 800;
          padding: 0.9rem;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 0.95rem;
          transition: background 0.2s;
        }
        .btn-submit:hover:not(:disabled) {
          background: #fde047;
        }
        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-cancel {
          flex: 1;
          background: #262626;
          color: white;
          font-weight: 700;
          padding: 0.9rem;
          border-radius: 6px;
          border: none;
          cursor: pointer;
        }
        .btn-cancel:hover:not(:disabled) {
          background: #333;
        }

        @media (max-width: 768px) {
          .header-box {
            flex-direction: column;
            align-items: stretch;
          }
          .btn-create-user {
            width: 100%;
            justify-content: center;
          }
          .filter-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .filter-group {
            flex-direction: column;
            align-items: stretch;
          }
          .action-buttons-wrap {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  )
}

