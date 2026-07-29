'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

type Pricing = { product_type: string; size_category: string; price: number }

type OrderDetailsProps = {
  orderId: string
  onClose: () => void
}

export default function OrderDetailsModal({ orderId, onClose }: OrderDetailsProps) {
  const supabase = createClient()
  
  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [customPricing, setCustomPricing] = useState<Pricing[]>([])
  const [loading, setLoading] = useState(true)

  // Nuevo item temporal
  const [newItem, setNewItem] = useState({ name: '', number: '', size: 'M', type: 'Uniforme' })
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    fetchData()
  }, [orderId])

  const fetchData = async () => {
    setLoading(true)
    
    // 1. Fetch Order
    const { data: orderData } = await supabase
      .from('orders')
      .select('*, customers(*)')
      .eq('id', orderId)
      .single()
      
    if (orderData) {
      setOrder(orderData)
      
      // 2. Fetch Pricing for this customer
      const { data: pricingData } = await supabase
        .from('customer_pricing')
        .select('*')
        .eq('customer_id', orderData.customer_id)
      if (pricingData) setCustomPricing(pricingData)
    }

    // 3. Fetch Items
    const { data: itemsData } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
      
    if (itemsData) setItems(itemsData)
    
    setLoading(false)
  }

  const calculatePrice = (size: string, type: string) => {
    let sizeCategory = 'Adulto'
    if (['4','6','8','10'].includes(size)) sizeCategory = 'Infantil'
    else if (['12','14','16'].includes(size)) sizeCategory = 'Juvenil'
    
    const custom = customPricing.find(p => p.product_type === type && p.size_category === sizeCategory)
    if (custom) return custom.price

    if (type === 'Uniforme') {
      if (sizeCategory === 'Infantil') return 40000
      if (sizeCategory === 'Juvenil') return 43000
      return 45000 
    }
    if (type === 'Chaqueta') return 65000
    if (type === 'Medias') return 12000
    if (type === 'Pantaloneta') return 20000
    
    return 35000
  }

  const syncOrderTotal = async (newItemsList: any[]) => {
    const newTotal = newItemsList.reduce((acc, curr) => acc + curr.calculated_price, 0)
    const newQty = newItemsList.length

    await supabase.from('orders').update({
      quantity: newQty,
      total_price: newTotal
    }).eq('id', orderId)
    
    setOrder({ ...order, quantity: newQty, total_price: newTotal })
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.name || !newItem.size) return
    setIsAdding(true)

    const price = calculatePrice(newItem.size, newItem.type)
    
    const itemToInsert = {
      order_id: orderId,
      player_name: newItem.name,
      player_number: newItem.number,
      size: newItem.size,
      product_type: newItem.type,
      calculated_price: price
    }

    const { data, error } = await supabase.from('order_items').insert([itemToInsert]).select().single()
    
    if (!error && data) {
      const newList = [...items, data]
      setItems(newList)
      await syncOrderTotal(newList)
      setNewItem({ name: '', number: '', size: newItem.size, type: newItem.type })
    }
    
    setIsAdding(false)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta prenda del pedido?')) return

    const { error } = await supabase.from('order_items').delete().eq('id', itemId)
    if (!error) {
      const newList = items.filter(i => i.id !== itemId)
      setItems(newList)
      await syncOrderTotal(newList)
    }
  }

  const handleDeleteOrder = async () => {
    if (!confirm('🚨 ATENCIÓN: ¿Estás seguro de que deseas eliminar TODO el pedido? Esta acción es irreversible.')) return
    
    setLoading(true)
    // Borrar ítems hijos primero por seguridad
    await supabase.from('order_items').delete().eq('order_id', orderId)
    // Borrar maestro
    const { error } = await supabase.from('orders').delete().eq('id', orderId)
    
    if (!error) {
      onClose()
    } else {
      alert('Error eliminando el pedido')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content advanced-modal">
        <div className="modal-header">
          <h2>Detalle de Pedido</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {!loading && <button onClick={handleDeleteOrder} className="btn-remove" style={{ border: '1px solid #ff5555' }}>🗑️ Eliminar Pedido</button>}
            <button onClick={onClose} className="btn-close">×</button>
          </div>
        </div>

        <div className="modal-body">
          {loading ? (
            <p style={{ color: 'white' }}>Cargando datos del pedido...</p>
          ) : (
            <>
              {/* RESUMEN MAESTRO */}
              <div className="master-summary">
                <div className="summary-block">
                  <span className="label">Cliente</span>
                  <strong>{order?.customers?.name}</strong>
                  <span>{order?.customers?.school_or_club}</span>
                </div>
                <div className="summary-block">
                  <span className="label">SKU / Diseño</span>
                  <strong className="text-primary">{order?.sku_reference}</strong>
                </div>
                <div className="summary-block highlight">
                  <span className="label">Finanzas</span>
                  <span>Total: <strong>${order?.total_price.toLocaleString('es-CO')}</strong></span>
                  <span>Abono: <strong className="text-primary">${order?.advance_payment.toLocaleString('es-CO')}</strong></span>
                  <span>Saldo: <strong className="text-red">${(order?.total_price - order?.advance_payment).toLocaleString('es-CO')}</strong></span>
                </div>
              </div>

              {/* AGREGAR ADICIONAL */}
              <div className="add-item-section">
                <h3>+ Agregar Adicional a este pedido</h3>
                <form onSubmit={handleAddItem} className="fast-form">
                  <input 
                    type="text" 
                    placeholder="Nombre en espalda" 
                    required 
                    value={newItem.name} 
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                  />
                  <input 
                    type="text" 
                    placeholder="Número" 
                    style={{ width: '80px' }}
                    value={newItem.number} 
                    onChange={e => setNewItem({...newItem, number: e.target.value})}
                  />
                  <select value={newItem.size} onChange={e => setNewItem({...newItem, size: e.target.value})}>
                    <optgroup label="Infantil"><option>4</option><option>6</option><option>8</option><option>10</option></optgroup>
                    <optgroup label="Juvenil"><option>12</option><option>14</option><option>16</option></optgroup>
                    <optgroup label="Adulto"><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></optgroup>
                  </select>
                  <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})}>
                    <option>Uniforme</option>
                    <option>Chaqueta</option>
                    <option>Medias</option>
                    <option>Pantaloneta</option>
                  </select>
                  <button type="submit" className="btn-add" disabled={isAdding}>
                    {isAdding ? '...' : 'Añadir'}
                  </button>
                </form>
              </div>

              {/* NÓMINA TABLE */}
              <div className="roster-table-container">
                <table className="roster-table">
                  <thead>
                    <tr>
                      <th>Jugador</th>
                      <th>#</th>
                      <th>Talla</th>
                      <th>Item</th>
                      <th>Precio</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td>{item.player_name}</td>
                        <td>{item.player_number}</td>
                        <td>{item.size}</td>
                        <td>{item.product_type}</td>
                        <td className="text-primary">${item.calculated_price.toLocaleString('es-CO')}</td>
                        <td>
                          <button onClick={() => handleDeleteItem(item.id)} className="btn-remove">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-content.advanced-modal {
          background: #0a0a0a; border: 1px solid rgba(255,255,255,0.1);
          width: 95%; max-width: 900px; border-radius: 12px; max-height: 95vh;
          display: flex; flex-direction: column;
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); background: #111;
        }
        .modal-header h2 { margin: 0; color: white; font-weight: 900; }
        .btn-close { background: none; border: none; color: white; font-size: 2rem; cursor: pointer; }
        
        .modal-body { padding: 2rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 2rem; }
        
        .master-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .summary-block { background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 0.3rem; color: white; }
        .summary-block .label { font-size: 0.8rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; }
        .summary-block.highlight { background: rgba(212,255,0,0.05); border-color: rgba(212,255,0,0.2); }
        
        .add-item-section { background: rgba(0,0,0,0.4); padding: 1.5rem; border-radius: 8px; border: 1px dashed rgba(255,255,255,0.2); }
        .add-item-section h3 { margin: 0 0 1rem 0; color: white; font-size: 1rem; }
        
        .fast-form { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .fast-form input, .fast-form select { padding: 0.6rem; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); background: #111; color: white; flex: 1; min-width: 120px; }
        .fast-form input:focus { border-color: var(--brand-primary); outline: none; }
        .btn-add { background: var(--brand-primary); border: none; color: black; font-weight: 800; padding: 0.6rem 1.5rem; border-radius: 4px; cursor: pointer; text-transform: uppercase; }
        .btn-add:disabled { opacity: 0.5; }
        
        .roster-table-container { background: #111; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); max-height: 400px; overflow-y: auto; }
        .roster-table { width: 100%; border-collapse: collapse; }
        .roster-table th { background: #1a1a1a; padding: 0.8rem; text-align: left; font-size: 0.8rem; color: rgba(255,255,255,0.5); text-transform: uppercase; position: sticky; top: 0; }
        .roster-table td { padding: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: white; font-size: 0.9rem; }
        .btn-remove { background: rgba(255,50,50,0.1); border: 1px solid rgba(255,50,50,0.3); color: #ff5555; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
        
        .text-primary { color: var(--brand-primary); }
        .text-red { color: #ff5555; }
      `}</style>
    </div>
  )
}
