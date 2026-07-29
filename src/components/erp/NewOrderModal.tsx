'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import catalogData from '@/data/catalogData.json'

type Customer = { id: string; name: string; school_or_club: string; city: string }
type OrderItem = { id: string; player_name: string; player_number: string; size: string; product_type: string; price: number }
type Pricing = { product_type: string; size_category: string; price: number }

export default function NewOrderModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Clientes
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [customPricing, setCustomPricing] = useState<Pricing[]>([])
  
  // Catálogo y Pedido General
  const [skuReference, setSkuReference] = useState('')
  const [advancePayment, setAdvancePayment] = useState(0)
  
  // Lista de Jugadores (Roster)
  const [items, setItems] = useState<OrderItem[]>([])
  const [lastConsecutive, setLastConsecutive] = useState<number | null>(null)
  
  // Formularios temporales
  const [newItem, setNewItem] = useState({ name: '', number: '', size: 'M', type: 'Uniforme' })
  const [newCustomer, setNewCustomer] = useState({ name: '', club: '', city: '' })
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('name', { ascending: true })
    if (data) setCustomers(data)
  }

  const loadCustomerPricing = async (customerId: string) => {
    const { data } = await supabase.from('customer_pricing').select('*').eq('customer_id', customerId)
    if (data) setCustomPricing(data)
  }

  const fetchConsecutives = async (customerId: string) => {
    const { data: orders } = await supabase.from('orders').select('id').eq('customer_id', customerId)
    if (!orders || orders.length === 0) {
      setLastConsecutive(null)
      return
    }
    const orderIds = orders.map(o => o.id)
    
    const { data: pastItems } = await supabase.from('order_items').select('player_number').in('order_id', orderIds)
    if (pastItems && pastItems.length > 0) {
      const nums = pastItems.map(i => parseInt(i.player_number)).filter(n => !isNaN(n))
      if (nums.length > 0) {
        const max = Math.max(...nums)
        setLastConsecutive(max)
        setNewItem(prev => ({ ...prev, number: String(max + 1) }))
      } else {
        setLastConsecutive(null)
      }
    } else {
      setLastConsecutive(null)
    }
  }

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setSelectedCustomerId(id)
    if (id && id !== 'new') {
      loadCustomerPricing(id)
      fetchConsecutives(id)
      setIsCreatingCustomer(false)
    } else if (id === 'new') {
      setIsCreatingCustomer(true)
    }
  }

  // Lógica de cálculo de precios
  const calculatePrice = (size: string, type: string) => {
    let sizeCategory = 'Adulto'
    if (['4','6','8','10'].includes(size)) sizeCategory = 'Infantil'
    else if (['12','14','16'].includes(size)) sizeCategory = 'Juvenil'
    
    // Buscar precio personalizado
    const custom = customPricing.find(p => p.product_type === type && p.size_category === sizeCategory)
    if (custom) return custom.price

    // Precios por defecto (Fallback)
    if (type === 'Uniforme') {
      if (sizeCategory === 'Infantil') return 40000
      if (sizeCategory === 'Juvenil') return 43000
      return 45000 // Adulto
    }
    if (type === 'Chaqueta') return 65000
    if (type === 'Medias') return 12000
    if (type === 'Pantaloneta') return 20000
    
    return 35000
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.name || !newItem.size) return
    
    const price = calculatePrice(newItem.size, newItem.type)
    
    setItems([...items, {
      id: Math.random().toString(),
      player_name: newItem.name,
      player_number: newItem.number,
      size: newItem.size,
      product_type: newItem.type,
      price
    }])
    
    // Auto-incrementar el número para el siguiente si es numérico
    const nextNum = parseInt(newItem.number) ? String(parseInt(newItem.number) + 1) : ''
    
    // Resetear formulario rápido
    setNewItem({ name: '', number: nextNum, size: newItem.size, type: newItem.type })
    
    // Enfocar automáticamente el input de nombre para cargar rápido (como en excel)
    document.getElementById('fast_name_input')?.focus()
  }

  const getNextConsecutive = () => {
    const dbMax = lastConsecutive !== null ? lastConsecutive : 0
    const itemsMax = items.length > 0 
      ? Math.max(0, ...items.map(i => parseInt(i.player_number)).filter(n => !isNaN(n)))
      : 0
    const maxOverall = Math.max(dbMax, itemsMax)
    return maxOverall === 0 ? (parseInt(newItem.number) || 1) : maxOverall + 1
  }

  const handleAutoGenerate = () => {
    const qtyStr = window.prompt('¿Cuántos números consecutivos quieres generar?', '10')
    if (!qtyStr) return
    const count = parseInt(qtyStr)
    if (isNaN(count) || count <= 0) return

    const startNum = getNextConsecutive()
    
    const generated: OrderItem[] = []
    for(let i=0; i<count; i++) {
      const price = calculatePrice(newItem.size, newItem.type)
      generated.push({
        id: Math.random().toString(),
        player_name: '',
        player_number: String(startNum + i),
        size: newItem.size,
        product_type: newItem.type,
        price
      })
    }
    
    setItems(prev => [...prev, ...generated])
    setNewItem(prev => ({ ...prev, number: String(startNum + count) }))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const updateItem = (id: string, field: keyof OrderItem, value: string) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  const handleCopyForWhatsApp = () => {
    let text = `*COTIZACIÓN DE PEDIDO*\n\n`
    const c = customers.find(cust => cust.id === selectedCustomerId)
    if (c || isCreatingCustomer) {
      text += `Cliente: ${c ? (c.school_or_club || c.name) : (newCustomer.club || newCustomer.name)}\n`
    }
    if (skuReference) text += `Diseño SKU: ${skuReference}\n`
    text += `Total prendas: ${items.length}\n\n`
    
    text += `*DETALLE DEL PEDIDO:*\n\n`
    items.forEach((item, idx) => {
      text += `${idx + 1}. #${item.player_number} | ${item.player_name || 'Sin nombre'} | Talla ${item.size} | ${item.product_type} - $${item.price.toLocaleString('es-CO')}\n\n`
    })
    
    text += `\n*VALOR TOTAL:* $${getTotalPrice().toLocaleString('es-CO')}\n`
    if (advancePayment > 0) {
      text += `Abono: $${advancePayment.toLocaleString('es-CO')}\n`
      text += `Saldo Pendiente: $${(getTotalPrice() - advancePayment).toLocaleString('es-CO')}\n`
    }
    
    navigator.clipboard.writeText(text)
    alert('✅ Cotización copiada al portapapeles. ¡Abre WhatsApp y pégala!')
  }

  const getTotalPrice = () => items.reduce((acc, curr) => acc + curr.price, 0)

  // Encontrar imagen del SKU en el catálogo
  const uniformData = catalogData.find(u => u.sku.toUpperCase() === skuReference.toUpperCase())
  const catalogImage = uniformData?.image || null

  const handleSubmitFinal = async () => {
    if (items.length === 0) {
      setError('Debes agregar al menos 1 item para procesar un pedido.')
      return
    }

    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()

    let finalCustomerId = selectedCustomerId

    // Si está creando un cliente nuevo
    if (isCreatingCustomer) {
      const { data: cData, error: cErr } = await supabase.from('customers').insert([{
        name: newCustomer.name,
        school_or_club: newCustomer.club,
        city: newCustomer.city
      }]).select().single()
      
      if (cErr) { setError('Error creando cliente'); setLoading(false); return }
      finalCustomerId = cData.id
    }

    // Crear el Pedido Maestro
    const { data: orderData, error: orderError } = await supabase.from('orders').insert([{
      customer_id: finalCustomerId,
      sku_reference: skuReference,
      quantity: items.length,
      total_price: getTotalPrice(),
      advance_payment: advancePayment,
      created_by: user?.id
    }]).select().single()

    if (orderError) { setError('Error creando pedido maestro'); setLoading(false); return }

    // Guardar la Nómina (Roster)
    const itemsToInsert = items.map(i => ({
      order_id: orderData.id,
      player_name: i.player_name,
      player_number: i.player_number,
      size: i.size,
      product_type: i.product_type,
      calculated_price: i.price
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert)

    setLoading(false)
    if (!itemsError) {
      onCreated()
      onClose()
    } else {
      setError('Error al guardar la lista de jugadores.')
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content advanced-modal">
        <div className="modal-header">
          <h2>Nuevo Pedido Avanzado</h2>
          <div className="steps-indicator">
            <span className={step >= 1 ? 'active' : ''}>1. Cliente</span>
            <span className={step >= 2 ? 'active' : ''}>2. Diseño</span>
            <span className={step >= 3 ? 'active' : ''}>3. Detalle de Pedido</span>
          </div>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-alert">{error}</div>}

          {/* PASO 1: CLIENTE */}
          {step === 1 && (
            <div className="step-content">
              <h3>Selecciona el Cliente</h3>
              <select className="big-select" value={selectedCustomerId} onChange={handleCustomerSelect}>
                <option value="">-- Seleccionar Cliente Existente --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.school_or_club} ({c.city})</option>
                ))}
                <option value="new">+ Crear Nuevo Cliente</option>
              </select>

              {isCreatingCustomer && (
                <div className="new-customer-form">
                  <input type="text" placeholder="Nombre completo" required value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                  <input type="text" placeholder="Escuela o Club" required value={newCustomer.club} onChange={e => setNewCustomer({...newCustomer, club: e.target.value})} />
                  <input type="text" placeholder="Ciudad" required value={newCustomer.city} onChange={e => setNewCustomer({...newCustomer, city: e.target.value})} />
                </div>
              )}

              <button 
                className="btn-next" 
                disabled={!selectedCustomerId && !isCreatingCustomer} 
                onClick={() => setStep(2)}
              >
                Siguiente Paso ➔
              </button>
            </div>
          )}

          {/* PASO 2: DISEÑO / SKU */}
          {step === 2 && (
            <div className="step-content">
              <h3>Diseño y SKU</h3>
              <div className="sku-lookup">
                <input 
                  type="text" 
                  placeholder="Ej: UM-001" 
                  className="big-input uppercase"
                  value={skuReference} 
                  onChange={e => setSkuReference(e.target.value.toUpperCase())}
                />
              </div>

              {catalogImage ? (
                <div className="sku-preview">
                  <div className="preview-status text-green">✓ Diseño encontrado en catálogo</div>
                  <img src={catalogImage} alt={skuReference} className="preview-img" />
                </div>
              ) : skuReference.length > 2 ? (
                <div className="preview-status text-yellow">
                  ⚠ SKU no encontrado en el catálogo local. Podrás usarlo de todas formas, pero no habrá previsualización.
                </div>
              ) : null}

              <div className="step-actions">
                <button className="btn-secondary" onClick={() => setStep(1)}>⬅ Volver</button>
                <button className="btn-next" disabled={!skuReference} onClick={() => setStep(3)}>
                  Cargar Pedido ➔
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: ROSTER Y PAGOS */}
          {step === 3 && (
            <div className="step-content split-layout">
              <div className="roster-section">
                <h3>Ingreso Rápido de Pedido</h3>
                {lastConsecutive !== null && (
                  <div className="info-alert">
                    💡 Historial: El último número pedido por este cliente fue el <strong>{lastConsecutive}</strong>.
                  </div>
                )}
                <form onSubmit={handleAddItem} className="fast-form">
                  <input 
                    id="fast_name_input"
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
                    <optgroup label="Infantil">
                      <option>4</option><option>6</option><option>8</option><option>10</option>
                    </optgroup>
                    <optgroup label="Juvenil">
                      <option>12</option><option>14</option><option>16</option>
                    </optgroup>
                    <optgroup label="Adulto">
                      <option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option>
                    </optgroup>
                  </select>
                  <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})}>
                    <option>Uniforme</option>
                    <option>Chaqueta</option>
                    <option>Medias</option>
                    <option>Pantaloneta</option>
                  </select>
                  <button type="submit" className="btn-add" title="Agregar uno manual">+</button>
                  <button type="button" onClick={handleAutoGenerate} className="btn-secondary" style={{ padding: '0 1rem', fontSize: '0.85rem' }} title="Autocompletar varios consecutivos">⚡ Generar</button>
                </form>

                <div className="roster-table-container">
                  <table className="roster-table">
                    <thead>
                      <tr>
                        <th>Jugador</th>
                        <th>#</th>
                        <th>Talla</th>
                        <th>Item</th>
                        <th>Precio</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id}>
                          <td>
                            <input 
                              type="text" 
                              value={item.player_name} 
                              onChange={e => updateItem(item.id, 'player_name', e.target.value)}
                              className="inline-edit"
                              placeholder="Escribe nombre..."
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              value={item.player_number} 
                              onChange={e => updateItem(item.id, 'player_number', e.target.value)}
                              className="inline-edit number"
                            />
                          </td>
                          <td>
                            <select 
                              value={item.size} 
                              onChange={e => {
                                const newSize = e.target.value;
                                const newPrice = calculatePrice(newSize, item.product_type);
                                setItems(items.map(i => i.id === item.id ? { ...i, size: newSize, price: newPrice } : i));
                              }}
                              className="inline-edit"
                            >
                              <optgroup label="Infantil"><option>4</option><option>6</option><option>8</option><option>10</option></optgroup>
                              <optgroup label="Juvenil"><option>12</option><option>14</option><option>16</option></optgroup>
                              <optgroup label="Adulto"><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></optgroup>
                            </select>
                          </td>
                          <td>{item.product_type}</td>
                          <td className="text-primary">${item.price.toLocaleString('es-CO')}</td>
                          <td><button onClick={() => removeItem(item.id)} className="btn-remove">×</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {items.length === 0 && <p className="empty-msg">No hay jugadores. Ingresa el primero arriba y dale Enter.</p>}
                </div>
              </div>

              <div className="finance-section">
                <h3>Resumen Financiero</h3>
                <div className="finance-card">
                  <div className="f-row">
                    <span>Cantidad Total:</span>
                    <strong>{items.length} unidades</strong>
                  </div>
                  <div className="f-row total">
                    <span>Valor Total:</span>
                    <strong>${getTotalPrice().toLocaleString('es-CO')}</strong>
                  </div>
                  <div className="f-row advance">
                    <label>Abono Cliente:</label>
                    <input 
                      type="number" 
                      min="0"
                      value={advancePayment || ''} 
                      onChange={e => setAdvancePayment(Number(e.target.value))}
                      placeholder="Ej: 500000"
                    />
                  </div>
                  <div className="f-row balance">
                    <span>Saldo Pendiente:</span>
                    <strong className="text-red">${(getTotalPrice() - advancePayment).toLocaleString('es-CO')}</strong>
                  </div>
                </div>

                <div className="step-actions vertical">
                  <button className="btn-secondary" onClick={handleCopyForWhatsApp} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <span style={{ color: '#25D366' }}>💬</span> Copiar para WhatsApp
                  </button>
                  <button className="btn-secondary" onClick={() => setStep(2)}>⬅ Volver a Diseño</button>
                  <button className="btn-submit" disabled={loading} onClick={handleSubmitFinal}>
                    {loading ? 'Procesando Pedido...' : 'Guardar Pedido Definitivo'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-content.advanced-modal {
          background: #0a0a0a;
          border: 1px solid rgba(255,255,255,0.1);
          width: 95%; max-width: 1000px;
          border-radius: 12px; max-height: 95vh;
          display: flex; flex-direction: column;
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); background: #111;
        }
        .modal-header h2 { margin: 0; color: white; font-weight: 900; }
        
        .steps-indicator { display: flex; gap: 1rem; }
        .steps-indicator span {
          color: rgba(255,255,255,0.3); font-size: 0.85rem; font-weight: 700; text-transform: uppercase;
        }
        .steps-indicator span.active { color: var(--brand-primary); }
        
        .btn-close { background: none; border: none; color: white; font-size: 2rem; cursor: pointer; }
        
        .modal-body { padding: 2rem; overflow-y: auto; flex: 1; }
        .step-content { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
        .step-content.split-layout { max-width: 100%; display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
        
        h3 { color: white; font-size: 1.2rem; margin: 0 0 1rem 0; }
        
        .big-select, .big-input {
          width: 100%; padding: 1rem; border-radius: 8px; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.2); color: white; font-size: 1.1rem; outline: none;
        }
        .big-select option {
          background: #111;
          color: white;
        }
        .big-input.uppercase { text-transform: uppercase; }
        .big-select:focus, .big-input:focus { border-color: var(--brand-primary); }
        
        .new-customer-form { display: flex; flex-direction: column; gap: 1rem; background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 8px; }
        .new-customer-form input { padding: 0.8rem; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: white; }
        
        .btn-next { background: var(--brand-primary); color: black; font-weight: 800; padding: 1rem; border: none; border-radius: 6px; cursor: pointer; text-transform: uppercase; }
        .btn-next:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary { background: rgba(255,255,255,0.1); color: white; font-weight: 800; padding: 1rem; border: none; border-radius: 6px; cursor: pointer; text-transform: uppercase; }
        .step-actions { display: flex; gap: 1rem; justify-content: space-between; margin-top: 2rem; }
        .step-actions.vertical { flex-direction: column; }
        
        .preview-img { width: 100%; max-width: 300px; border-radius: 8px; margin: 1rem auto; display: block; border: 2px solid rgba(255,255,255,0.1); }
        .preview-status { text-align: center; font-size: 0.9rem; font-weight: 700; }
        .text-green { color: #4ade80; }
        .text-yellow { color: #facc15; }
        .text-primary { color: var(--brand-primary); }
        .text-red { color: #ff5555; }
        
        /* FAST FORM */
        .fast-form { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
        .fast-form input, .fast-form select { padding: 0.6rem; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); background: #111; color: white; }
        .fast-form input:focus { border-color: var(--brand-primary); outline: none; }
        .btn-add { background: var(--brand-primary); border: none; color: black; font-weight: 900; font-size: 1.2rem; padding: 0 1rem; border-radius: 4px; cursor: pointer; }
        
        /* ROSTER TABLE */
        .roster-table-container { background: #111; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); height: 350px; overflow-y: auto; }
        .roster-table { width: 100%; border-collapse: collapse; }
        .roster-table th { background: #1a1a1a; padding: 0.8rem; text-align: left; font-size: 0.8rem; color: rgba(255,255,255,0.5); text-transform: uppercase; position: sticky; top: 0; }
        .roster-table td { padding: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: white; font-size: 0.9rem; }
        .btn-remove { background: none; border: none; color: #ff5555; font-size: 1.2rem; cursor: pointer; }
        .empty-msg { text-align: center; color: rgba(255,255,255,0.3); margin-top: 2rem; }
        
        .inline-edit { background: transparent; border: 1px dashed rgba(255,255,255,0.2); color: white; padding: 0.3rem; width: 100%; border-radius: 4px; transition: border 0.2s; }
        .inline-edit:focus { border-color: var(--brand-primary); outline: none; background: rgba(255,255,255,0.05); border-style: solid; }
        .inline-edit.number { width: 50px; text-align: center; }
        select.inline-edit { padding: 0.2rem; }
        select.inline-edit option { background: #111; color: white; }
        
        /* FINANCE */
        .finance-card { background: #111; padding: 1.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 1rem; }
        .f-row { display: flex; justify-content: space-between; align-items: center; color: rgba(255,255,255,0.8); }
        .f-row.total { font-size: 1.2rem; color: white; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem; }
        .f-row.advance { background: rgba(212,255,0,0.05); padding: 1rem; border-radius: 6px; }
        .f-row.advance input { text-align: right; background: rgba(0,0,0,0.5); border: 1px solid rgba(212,255,0,0.3); padding: 0.5rem; color: white; border-radius: 4px; width: 120px; outline: none; }
        .f-row.balance { font-size: 1.2rem; background: rgba(255,50,50,0.05); padding: 1rem; border-radius: 6px; }
        
        .btn-submit { background: var(--brand-primary); color: black; font-weight: 800; padding: 1rem; border: none; border-radius: 6px; cursor: pointer; text-transform: uppercase; font-size: 1rem; }
        .btn-submit:disabled { opacity: 0.5; }
        .error-alert { background: rgba(255,50,50,0.1); color: #ff5555; padding: 1rem; border-radius: 6px; border: 1px solid rgba(255,50,50,0.2); margin-bottom: 1rem; }
        .info-alert { background: rgba(212, 255, 0, 0.05); color: #d4ff00; padding: 0.8rem; border-radius: 6px; border: 1px solid rgba(212, 255, 0, 0.2); margin-bottom: 1rem; font-size: 0.85rem; }
        
        @media (max-width: 768px) {
          .step-content.split-layout { grid-template-columns: 1fr; }
          .fast-form { flex-wrap: wrap; }
          #fast_name_input { flex: 1; min-width: 200px; }
        }
      `}</style>
    </div>
  )
}
