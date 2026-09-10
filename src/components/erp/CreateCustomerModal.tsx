'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from '@/context/NotificationContext'

export default function CreateCustomerModal({
  onClose,
  onCreated
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  
  const [phoneList, setPhoneList] = useState<string[]>([''])
  const [formData, setFormData] = useState({
    name: '',
    school_or_club: '',
    city: '',
    address: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.warning('Por favor ingresa el nombre del cliente o contacto.')
      return
    }

    setSaving(true)
    const finalPhone = phoneList.filter(Boolean).map(p => p.trim()).join(', ')
    const dataToSave = {
      name: formData.name.trim(),
      school_or_club: formData.school_or_club.trim() || null,
      city: formData.city.trim() || null,
      address: formData.address.trim() || null,
      phone: finalPhone || null
    }

    const { data, error } = await supabase
      .from('customers')
      .insert([dataToSave])
      .select()
      .single()

    setSaving(false)

    if (error) {
      toast.error(`Error al registrar el cliente: ${error.message || 'Error desconocido'}`)
      return
    }

    toast.success(`✅ Cliente "${formData.name.trim()}" registrado exitosamente.`)
    onCreated()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content create-customer-modal">
        <div className="modal-header">
          <div>
            <span className="badge-tag">CRM Clientes</span>
            <h2>Registrar Nuevo Cliente</h2>
          </div>
          <button onClick={onClose} type="button" className="btn-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>
              Nombre del Contacto / Cliente <span style={{ color: 'var(--brand-primary, #d4ff00)' }}>*</span>
            </label>
            <input 
              type="text" 
              required
              placeholder="Ej. Juan Pérez / Club Deportivo"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Escuela, Club o Entidad (Opcional)</label>
            <input 
              type="text" 
              placeholder="Ej. Escuela Militar, Club Los Pumas, etc."
              value={formData.school_or_club}
              onChange={e => setFormData({ ...formData, school_or_club: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Ciudad</label>
              <input 
                type="text" 
                placeholder="Ej. Bogotá, Medellín, Cali..."
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Dirección (Opcional)</label>
              <input 
                type="text" 
                placeholder="Ej. Cra 15 # 45 - 20"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Teléfonos de Contacto</label>
            {phoneList.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <input 
                  type="text" 
                  value={p}
                  placeholder="Número de teléfono (ej. 300 123 4567)"
                  onChange={e => {
                    const newList = [...phoneList]
                    newList[idx] = e.target.value
                    setPhoneList(newList)
                  }}
                  style={{ flex: 1 }}
                />
                {phoneList.length > 1 && (
                  <button 
                    type="button" 
                    className="btn-secondary btn-icon" 
                    onClick={() => setPhoneList(phoneList.filter((_, i) => i !== idx))}
                    title="Eliminar número"
                  >✕</button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              className="btn-secondary add-phone-btn" 
              onClick={() => setPhoneList([...phoneList, ''])} 
            >
              + Agregar Otro Teléfono
            </button>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal-content.create-customer-modal {
          background: #0d0d0d;
          border: 1px solid rgba(255,255,255,0.12);
          width: 95%;
          max-width: 600px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8);
          animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 1.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: #111;
          border-radius: 14px 14px 0 0;
        }
        .badge-tag {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--brand-primary, #d4ff00);
          font-weight: 800;
          display: block;
          margin-bottom: 0.25rem;
        }
        .modal-header h2 {
          margin: 0;
          color: white;
          font-weight: 900;
          font-size: 1.35rem;
        }
        .btn-close {
          background: none;
          border: none;
          color: rgba(255,255,255,0.6);
          font-size: 2rem;
          cursor: pointer;
          line-height: 1;
          transition: color 0.15s;
        }
        .btn-close:hover {
          color: white;
        }
        .modal-body {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          max-height: calc(85vh - 120px);
          overflow-y: auto;
        }
        .form-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .form-group label {
          color: rgba(255,255,255,0.75);
          font-weight: 600;
          font-size: 0.88rem;
        }
        .form-group input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.18);
          padding: 0.8rem;
          border-radius: 8px;
          color: white;
          font-size: 0.95rem;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .form-group input:focus {
          border-color: var(--brand-primary, #d4ff00);
          box-shadow: 0 0 0 2px rgba(212, 255, 0, 0.15);
        }
        .btn-icon {
          padding: 0.8rem 1rem;
          border-radius: 8px;
        }
        .add-phone-btn {
          align-self: flex-start;
          margin-top: 0.25rem;
          font-size: 0.82rem;
          padding: 0.5rem 0.9rem;
          border-radius: 6px;
        }
        .modal-footer {
          margin-top: 0.75rem;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .btn-secondary {
          background: rgba(255,255,255,0.08);
          color: white;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 0.75rem 1.4rem;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-secondary:hover {
          background: rgba(255,255,255,0.14);
        }
        .btn-primary {
          background: var(--brand-primary, #d4ff00);
          color: black;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 900;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.15s;
        }
        .btn-primary:hover {
          background: var(--brand-primary-hover, #b8e600);
          box-shadow: 0 4px 14px rgba(212, 255, 0, 0.4);
          transform: translateY(-1px);
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  )
}
