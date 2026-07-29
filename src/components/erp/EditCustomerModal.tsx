'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Customer = {
  id: string
  name: string
  school_or_club: string
  city: string
  phone: string
  address: string
}

export default function EditCustomerModal({ customer, onClose, onUpdated }: { customer: Customer, onClose: () => void, onUpdated: () => void }) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: customer.name || '',
    school_or_club: customer.school_or_club || '',
    city: customer.city || '',
    phone: customer.phone || '',
    address: customer.address || ''
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const { error } = await supabase
      .from('customers')
      .update(formData)
      .eq('id', customer.id)
      
    setSaving(false)
    if (!error) {
      onUpdated()
      onClose()
    } else {
      alert('Error al guardar los cambios.')
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content edit-modal">
        <div className="modal-header">
          <h2>Editar Cliente</h2>
          <button onClick={onClose} type="button" className="btn-close">×</button>
        </div>
        
        <form onSubmit={handleSave} className="modal-body">
          <div className="form-group">
            <label>Nombre del Contacto / Cliente</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Escuela, Club o Entidad</label>
            <input 
              type="text" 
              value={formData.school_or_club}
              onChange={e => setFormData({...formData, school_or_club: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Ciudad</label>
            <input 
              type="text" 
              value={formData.city}
              onChange={e => setFormData({...formData, city: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Dirección (Opcional)</label>
            <input 
              type="text" 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Teléfonos (Separados por coma)</label>
            <textarea 
              rows={3}
              placeholder="Ej: 3001234567, 3109876543 (Asistente)"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-content.edit-modal {
          background: #0a0a0a; border: 1px solid rgba(255,255,255,0.1);
          width: 95%; max-width: 600px; border-radius: 12px;
          display: flex; flex-direction: column;
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); background: #111;
        }
        .modal-header h2 { margin: 0; color: white; font-weight: 900; }
        .btn-close { background: none; border: none; color: white; font-size: 2rem; cursor: pointer; }
        
        .modal-body { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { color: rgba(255,255,255,0.7); font-weight: 600; font-size: 0.9rem; }
        .form-group input, .form-group textarea {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2);
          padding: 0.8rem; border-radius: 6px; color: white; font-size: 1rem; outline: none;
          font-family: inherit;
        }
        .form-group input:focus, .form-group textarea:focus { border-color: var(--brand-primary); }
        
        .modal-footer {
          margin-top: 1rem; display: flex; justify-content: flex-end; gap: 1rem;
        }
        .btn-secondary { background: rgba(255,255,255,0.1); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 6px; font-weight: 700; cursor: pointer; }
        .btn-primary { background: var(--brand-primary); color: black; border: none; padding: 0.8rem 1.5rem; border-radius: 6px; font-weight: 900; cursor: pointer; text-transform: uppercase; }
        .btn-primary:disabled { opacity: 0.5; }
      `}</style>
    </div>
  )
}
