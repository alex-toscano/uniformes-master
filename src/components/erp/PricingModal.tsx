'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

type PricingRule = {
  id?: string
  customer_id: string
  product_type: string
  size_category: string
  price: number
}

const DEFAULT_CATEGORIES = ['Infantil', 'Juvenil', 'Adulto']
const DEFAULT_PRODUCTS = ['Uniforme', 'Chaqueta', 'Pantaloneta', 'Medias']

export default function PricingModal({ customerId, customerName, onClose }: { customerId: string, customerName: string, onClose: () => void }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pricing, setPricing] = useState<PricingRule[]>([])

  useEffect(() => {
    fetchPricing()
  }, [])

  const fetchPricing = async () => {
    const { data } = await supabase.from('customer_pricing').select('*').eq('customer_id', customerId)
    if (data) {
      setPricing(data)
    }
    setLoading(false)
  }

  const handlePriceChange = (product_type: string, size_category: string, newPrice: number) => {
    const existing = pricing.find(p => p.product_type === product_type && p.size_category === size_category)
    if (existing) {
      setPricing(pricing.map(p => p.id === existing.id || (p.product_type === product_type && p.size_category === size_category) ? { ...p, price: newPrice } : p))
    } else {
      setPricing([...pricing, { customer_id: customerId, product_type, size_category, price: newPrice }])
    }
  }

  const getPrice = (product_type: string, size_category: string) => {
    const p = pricing.find(p => p.product_type === product_type && p.size_category === size_category)
    return p ? p.price : ''
  }

  const savePricing = async () => {
    setSaving(true)
    
    // Borramos precios actuales para insertar los nuevos sin duplicar
    await supabase.from('customer_pricing').delete().eq('customer_id', customerId)
    
    const toInsert = pricing.filter(p => p.price > 0).map(p => ({
      customer_id: customerId,
      product_type: p.product_type,
      size_category: p.size_category,
      price: p.price
    }))

    if (toInsert.length > 0) {
      await supabase.from('customer_pricing').insert(toInsert)
    }

    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content pricing-modal">
        <div className="modal-header">
          <h2>Lista de Precios Especial</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>
        
        <div className="modal-body">
          <p className="subtitle">Configura los precios para <strong>{customerName}</strong>. La calculadora del ERP usará estos valores automáticamente.</p>

          {loading ? (
            <div style={{ color: 'white' }}>Cargando precios actuales...</div>
          ) : (
            <div className="pricing-grid">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    {DEFAULT_CATEGORIES.map(cat => <th key={cat}>{cat}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {DEFAULT_PRODUCTS.map(prod => (
                    <tr key={prod}>
                      <td className="product-name">{prod}</td>
                      {DEFAULT_CATEGORIES.map(cat => (
                        <td key={`${prod}-${cat}`}>
                          <div className="input-money">
                            <span>$</span>
                            <input 
                              type="number" 
                              placeholder="Ej: 40000"
                              value={getPrice(prod, cat)}
                              onChange={(e) => handlePriceChange(prod, cat, parseFloat(e.target.value))}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" disabled={saving || loading} onClick={savePricing}>
            {saving ? 'Guardando...' : 'Guardar Precios'}
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-content.pricing-modal {
          background: #0a0a0a; border: 1px solid rgba(255,255,255,0.1);
          width: 95%; max-width: 800px; border-radius: 12px;
          display: flex; flex-direction: column;
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); background: #111;
        }
        .modal-header h2 { margin: 0; color: white; font-weight: 900; }
        .btn-close { background: none; border: none; color: white; font-size: 2rem; cursor: pointer; }
        
        .modal-body { padding: 2rem; overflow-y: auto; max-height: 60vh; }
        .subtitle { color: rgba(255,255,255,0.6); margin-bottom: 2rem; font-size: 0.95rem; line-height: 1.5; }
        
        .pricing-grid table { width: 100%; border-collapse: collapse; min-width: 500px; }
        .pricing-grid th { text-align: left; padding: 1rem; color: rgba(255,255,255,0.4); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .pricing-grid td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .product-name { color: white; font-weight: 700; }
        
        .input-money {
          display: flex; align-items: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 0.5rem;
        }
        .input-money span { color: rgba(255,255,255,0.4); margin-right: 0.5rem; }
        .input-money input { background: transparent; border: none; color: white; outline: none; width: 100%; font-size: 1rem; }
        .input-money:focus-within { border-color: var(--brand-primary); }
        
        .modal-footer {
          padding: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); background: #111;
          display: flex; justify-content: flex-end; gap: 1rem;
        }
        .btn-secondary { background: rgba(255,255,255,0.1); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 6px; font-weight: 700; cursor: pointer; }
        .btn-primary { background: var(--brand-primary); color: black; border: none; padding: 0.8rem 1.5rem; border-radius: 6px; font-weight: 900; cursor: pointer; text-transform: uppercase; }
        .btn-primary:disabled { opacity: 0.5; }
        
        @media (max-width: 768px) {
          .pricing-grid table { display: block; overflow-x: auto; }
        }
      `}</style>
    </div>
  )
}
