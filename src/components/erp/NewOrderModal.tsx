'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function NewOrderModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    school_or_club: '',
    city: '',
    sku_reference: '',
    quantity: 6,
    total_price: 0,
    advance_payment: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    // 1. Create customer
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .insert([{
        name: formData.name,
        school_or_club: formData.school_or_club,
        city: formData.city
      }])
      .select()
      .single()

    if (customerError || !customerData) {
      console.error(customerError)
      setLoading(false)
      return
    }

    // 2. Create order
    const { error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_id: customerData.id,
        sku_reference: formData.sku_reference,
        quantity: formData.quantity,
        total_price: formData.total_price,
        advance_payment: formData.advance_payment,
        created_by: user?.id
      }])

    setLoading(false)
    if (!orderError) {
      onCreated() // Refresca tablero si es necesario
      onClose()
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Nuevo Pedido</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="order-form">
          <div className="form-section">
            <h3>Datos del Cliente</h3>
            <div className="form-group">
              <label>Nombre del Contacto</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Club o Escuela</label>
              <input required type="text" value={formData.school_or_club} onChange={e => setFormData({...formData, school_or_club: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Ciudad</label>
              <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
            </div>
          </div>

          <div className="form-section">
            <h3>Datos del Pedido</h3>
            <div className="form-group">
              <label>SKU (Referencia Diseño)</label>
              <input required type="text" value={formData.sku_reference} onChange={e => setFormData({...formData, sku_reference: e.target.value})} />
            </div>
            <div className="form-group row">
              <div>
                <label>Cantidad (Mín 6)</label>
                <input required type="number" min="6" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} />
              </div>
              <div>
                <label>Precio Total ($)</label>
                <input required type="number" value={formData.total_price} onChange={e => setFormData({...formData, total_price: parseFloat(e.target.value)})} />
              </div>
            </div>
            <div className="form-group">
              <label>Abono Realizado ($)</label>
              <input required type="number" value={formData.advance_payment} onChange={e => setFormData({...formData, advance_payment: parseFloat(e.target.value)})} />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Pedido'}
          </button>
        </form>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #111;
          border: 1px solid rgba(255,255,255,0.1);
          width: 90%;
          max-width: 600px;
          border-radius: 12px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .modal-header h2 { margin: 0; color: white; font-weight: 800; font-size: 1.5rem; }
        .btn-close { background: none; border: none; color: white; font-size: 2rem; cursor: pointer; line-height: 1; }
        
        .order-form {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .form-section h3 {
          color: var(--brand-primary);
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .form-group.row {
          flex-direction: row;
          gap: 1rem;
        }
        .form-group.row > div { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
        
        .form-group label {
          color: rgba(255,255,255,0.7);
          font-size: 0.85rem;
        }
        .form-group input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 0.8rem;
          border-radius: 6px;
          color: white;
        }
        .form-group input:focus {
          border-color: var(--brand-primary);
          outline: none;
        }
        
        .btn-submit {
          background: var(--brand-primary);
          color: black;
          font-weight: 800;
          padding: 1rem;
          border: none;
          border-radius: 6px;
          text-transform: uppercase;
          cursor: pointer;
          margin-top: 1rem;
          transition: background 0.2s;
        }
        .btn-submit:hover:not(:disabled) {
          background: #e1ff00;
        }
        .btn-submit:disabled {
          opacity: 0.6;
        }
      `}</style>
    </div>
  )
}
