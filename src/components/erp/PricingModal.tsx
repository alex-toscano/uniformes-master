'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast, confirmModal } from '@/context/NotificationContext'
import { formatThousands, parseThousands } from '@/utils/formatters'
import {
  BaseProduct,
  fetchBaseProducts,
  getBasePrice,
  DEFAULT_CATEGORIES
} from '@/utils/productCatalog'
import ProductCatalogModal from '@/components/erp/ProductCatalogModal'

type PricingRule = {
  id?: string
  customer_id: string
  product_type: string
  size_category: string
  price: number
}

export default function PricingModal({ customerId, customerName, onClose }: { customerId: string, customerName: string, onClose: () => void }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pricing, setPricing] = useState<PricingRule[]>([])
  const [baseProducts, setBaseProducts] = useState<BaseProduct[]>([])
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false)
  const [isGerente, setIsGerente] = useState(false)

  useEffect(() => {
    fetchPricing()
    loadBaseCatalog()
    checkUserRole()

    const handleCatalogUpdated = () => {
      loadBaseCatalog()
    }
    window.addEventListener('catalog-updated', handleCatalogUpdated)
    return () => window.removeEventListener('catalog-updated', handleCatalogUpdated)
  }, [customerId])

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (user.email === 'superadmin@mcm.com') {
      setIsGerente(true)
      return
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role || user.user_metadata?.role || 'vendedor'
    if (role === 'admin' || role === 'super_admin' || user.email?.includes('admin')) {
      setIsGerente(true)
    }
  }

  const loadBaseCatalog = async () => {
    const list = await fetchBaseProducts(supabase)
    setBaseProducts(list)
  }

  const fetchPricing = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('customer_pricing').select('*').eq('customer_id', customerId)
    if (!error && data) {
      setPricing(data)
    } else {
      setPricing([])
    }
    setLoading(false)
  }

  const handlePriceChange = (product_type: string, size_category: string, rawValue: string) => {
    const numeric = parseThousands(rawValue)

    setPricing(prev => {
      // Filtrar únicamente el registro exacto de este producto y categoría para no tocar los demás
      const others = prev.filter(
        p => !(p.product_type === product_type && p.size_category === size_category)
      )
      if (rawValue.trim() !== '' && numeric > 0) {
        return [...others, { customer_id: customerId, product_type, size_category, price: numeric }]
      }
      return others
    })
  }

  const getPrice = (product_type: string, size_category: string): string => {
    const item = pricing.find(p => p.product_type === product_type && p.size_category === size_category)
    return item && item.price > 0 ? formatThousands(item.price) : ''
  }

  const fillDefaultPrices = () => {
    const defaults: PricingRule[] = []
    for (const prod of baseProducts) {
      for (const cat of DEFAULT_CATEGORIES) {
        defaults.push({
          customer_id: customerId,
          product_type: prod.name,
          size_category: cat,
          price: getBasePrice(baseProducts, prod.name, cat)
        })
      }
    }
    setPricing(defaults)
  }

  const clearPrices = async () => {
    const confirmed = await confirmModal({
      title: 'Vaciar Precios Especiales',
      message: '¿Deseas vaciar los precios personalizados de este cliente? El sistema volverá a usar los precios base predeterminados.',
      confirmText: 'Sí, restablecer base',
      cancelText: 'Cancelar',
      type: 'warning'
    })
    if (confirmed) {
      setPricing([])
      toast.info('Precios personalizados vaciados. Se usarán los precios base.')
    }
  }

  const savePricing = async () => {
    setSaving(true)
    try {
      // 1. Borramos precios actuales para insertar los nuevos sin duplicados
      await supabase.from('customer_pricing').delete().eq('customer_id', customerId)
      
      // 2. Deduplicar por clave única producto + categoría
      const uniqueMap = new Map<string, number>()
      for (const p of pricing) {
        if (p.price > 0) {
          uniqueMap.set(`${p.product_type}:::${p.size_category}`, p.price)
        }
      }

      const toInsert: { customer_id: string; product_type: string; size_category: string; price: number }[] = []
      uniqueMap.forEach((price, key) => {
        const [product_type, size_category] = key.split(':::')
        toInsert.push({
          customer_id: customerId,
          product_type,
          size_category,
          price
        })
      })

      if (toInsert.length > 0) {
        const { error } = await supabase.from('customer_pricing').insert(toInsert)
        if (error) throw error
      }

      toast.success(`Precios especiales guardados exitosamente para "${customerName}".`)
      onClose()
    } catch (err: any) {
      toast.error(`Error al guardar precios: ${err.message || 'Error desconocido'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content pricing-modal">
        <div className="modal-header">
          <h2>Lista de Precios Especial</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>
        
        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <p className="subtitle" style={{ margin: 0, flex: 1, minWidth: '260px' }}>
              Configura los precios especiales para <strong>{customerName}</strong>. Cada producto y categoría se guarda de forma totalmente independiente. Si dejas una celda vacía, el ERP usará el precio sugerido en gris.
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {isGerente && (
                <button 
                  type="button" 
                  onClick={() => setIsCatalogModalOpen(true)}
                  className="btn-quick-action"
                  style={{ background: 'rgba(212, 255, 0, 0.12)', color: 'var(--brand-primary)', borderColor: 'rgba(212, 255, 0, 0.3)' }}
                  title="Crear, modificar o eliminar prendas del catálogo maestro"
                >
                  ⚙️ Gestionar Catálogo Base
                </button>
              )}
              <button 
                type="button" 
                onClick={fillDefaultPrices}
                className="btn-quick-action"
                title="Cargar los precios sugeridos para editarlos"
              >
                ⚡ Cargar Sugeridos
              </button>
              <button 
                type="button" 
                onClick={clearPrices}
                className="btn-quick-action btn-clear"
                title="Limpiar precios personalizados"
              >
                🗑️ Limpiar
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Cargando precios actuales...</div>
          ) : (
            <div className="pricing-grid">
              <table>
                <thead>
                  <tr>
                    <th>Producto / Prenda</th>
                    {DEFAULT_CATEGORIES.map(cat => <th key={cat}>{cat}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {baseProducts.map(prod => (
                    <tr key={prod.name}>
                      <td className="product-name">{prod.name}</td>
                      {DEFAULT_CATEGORIES.map(cat => (
                        <td key={`${prod.name}-${cat}`}>
                          <div className="input-money">
                            <span>$</span>
                            <input 
                              type="text"
                              inputMode="numeric"
                              placeholder={formatThousands(getBasePrice(baseProducts, prod.name, cat))}
                              value={getPrice(prod.name, cat)}
                              onChange={(e) => handlePriceChange(prod.name, cat, e.target.value)}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                  {baseProducts.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
                        No hay prendas configuradas en el catálogo.
                      </td>
                    </tr>
                  )}
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

        {isCatalogModalOpen && (
          <ProductCatalogModal
            onClose={() => setIsCatalogModalOpen(false)}
          />
        )}
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
        .subtitle { color: rgba(255,255,255,0.6); font-size: 0.95rem; line-height: 1.5; }
        
        .btn-quick-action {
          background: rgba(255, 255, 255, 0.08);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.45rem 0.8rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .btn-quick-action:hover {
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.3);
        }
        .btn-quick-action.btn-clear:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.4);
        }

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
