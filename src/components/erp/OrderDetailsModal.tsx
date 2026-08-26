'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
  
  // Observaciones y tela
  const [observations, setObservations] = useState('')
  const [fabricMeters, setFabricMeters] = useState('')
  const [isSavingMeta, setIsSavingMeta] = useState(false)
  
  // UX UI Mejoras
  const [activeTab, setActiveTab] = useState<'resumen' | 'nomina' | 'produccion'>('resumen')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

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
      setObservations(orderData.observations || '')
      setFabricMeters(orderData.fabric_meters ? orderData.fabric_meters.toString() : '')
      
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
    if (deleteConfirmText !== 'ELIMINAR') return
    
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

  const handleSaveMeta = async () => {
    setIsSavingMeta(true)
    const { error } = await supabase.from('orders').update({
      observations,
      fabric_meters: fabricMeters ? parseFloat(fabricMeters) : 0
    }).eq('id', orderId)
    
    if (!error) {
      alert('Observaciones y consumo de tela guardados')
    } else {
      alert('Error al guardar datos')
    }
    setIsSavingMeta(false)
  }

  const handleCopyForWhatsApp = () => {
    if (!order) return
    let text = `*COTIZACIÓN DE PEDIDO*\n\n`
    text += `Cliente: ${order.customers?.school_or_club || order.customers?.name}\n`
    text += `Diseño SKU: ${order.sku_reference || 'EXTERNO'}\n`
    text += `Total prendas: ${items.length}\n\n`
    
    text += `*DETALLE DEL PEDIDO:*\n\n`
    
    items.forEach((item, idx) => {
      text += `${idx + 1}. #${item.player_number} | ${item.player_name?.toUpperCase() || 'SIN NOMBRE'} | Talla ${item.size} | ${item.product_type} - $${item.calculated_price.toLocaleString('es-CO')}\n\n`
    })
    
    text += `*VALOR TOTAL:* $${order.total_price.toLocaleString('es-CO')}\n`
    
    navigator.clipboard.writeText(text)
    alert('✅ Pedido copiado al portapapeles. ¡Abre WhatsApp y pégalo!')
  }

  const handleDownloadPDF = async () => {
    if (!order) return
    
    const doc = new jsPDF()

    // --- ENCABEZADO SUPERIOR ---
    // Rectángulo Azul Oscuro (Izquierda)
    doc.setFillColor(15, 23, 42) // #0f172a
    doc.rect(0, 0, 140, 40, 'F')
    
    // Rectángulo Verde Brillante (Derecha)
    doc.setFillColor(34, 197, 94) // #22c55e
    doc.rect(140, 0, 70, 40, 'F')

    // Logo (Intentar cargar de /logo.png)
    try {
      const response = await fetch('/logo.png')
      const blob = await response.blob()
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      await new Promise(resolve => {
        reader.onloadend = () => {
          if (reader.result) {
            doc.addImage(reader.result as string, 'PNG', 10, 5, 30, 30)
          }
          resolve(true)
        }
      })
    } catch (e) {
      console.log('No logo found, skipping.')
    }

    // Texto Encabezado Izquierdo
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.text('Uniformes Master', 45, 14)
    
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(209, 213, 219) // #d1d5db
    doc.text('Bogotá • Colombia', 45, 20)
    doc.text('Calle 61 A Sur #97b-12', 45, 25)
    doc.text('Tel: 301 281 5448', 45, 30)
    doc.text(`Orden: #${order.sku_reference || order.id.slice(0,6).toUpperCase()}`, 45, 35)
    
    // Texto Encabezado Derecho
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text('ORDEN DE PEDIDO', 175, 20, { align: 'center' })
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    const today = new Date().toLocaleDateString('es-CO')
    doc.text(`Fecha: ${today}`, 175, 26, { align: 'center' })


    // --- INFORMACIÓN DEL CLIENTE ---
    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text('INFORMACIÓN DEL CLIENTE', 15, 55)
    
    // Línea naranja decorativa
    doc.setDrawColor(249, 115, 22) // #f97316
    doc.setLineWidth(0.8)
    doc.line(15, 57, 65, 57)

    // Caja Gris Clara
    doc.setFillColor(243, 244, 246) // #f3f4f6
    doc.roundedRect(15, 65, 180, 25, 3, 3, 'F')

    // Textos de la Caja Gris
    doc.setFontSize(7)
    doc.setTextColor(107, 114, 128) // #6b7280
    doc.setFont("helvetica", "normal")
    doc.text('NOMBRE COMPLETO:', 20, 72)
    doc.text('ESCUELA / CLUB:', 20, 84)
    doc.text('DISEÑO SKU:', 110, 72)
    doc.text('FECHA EMISIÓN:', 110, 84)

    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "bold")
    doc.text(`${order.customers?.name?.toUpperCase()}`, 20, 77)
    doc.text(`${order.customers?.school_or_club?.toUpperCase() || 'N/A'}`, 20, 88)
    doc.text(`${order.sku_reference || 'EXTERNO'}`, 110, 77)
    doc.text(`${today}`, 110, 88)

    // --- TABLA DE ITEMS ---
    const tableData = items.map((item, idx) => [
      (idx + 1).toString(),
      `#${item.player_number}`,
      item.player_name?.toUpperCase() || 'SIN NOMBRE',
      `Talla ${item.size}`,
      item.product_type,
      `$${item.calculated_price.toLocaleString('es-CO')}`
    ])

    autoTable(doc, {
      startY: 105,
      head: [['N°', 'NÚMERO', 'NOMBRE', 'TALLA', 'TIPO', 'PRECIO']],
      body: tableData,
      theme: 'plain',
      headStyles: { 
        fillColor: [15, 23, 42], // #0f172a
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 4
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [0, 0, 0],
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] // #f9fafb
      },
      styles: {
        lineColor: [229, 231, 235], // #e5e7eb
        lineWidth: { bottom: 0.1 }
      }
    })

    // --- TOTALES ---
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY || 105
    
    // Caja verde claro de totales
    doc.setFillColor(240, 253, 244) // #f0fdf4
    doc.rect(135, finalY + 5, 60, 15, 'F')
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(22, 101, 52) // #166534
    doc.text('VALOR TOTAL:', 140, finalY + 15)
    
    doc.setFontSize(11)
    doc.text(`$${order.total_price.toLocaleString('es-CO')}`, 190, finalY + 15, { align: 'right' })

    // --- PIE DE PÁGINA (FIRMAS) ---
    const footerY = 255
    doc.setDrawColor(209, 213, 219)
    doc.setLineWidth(0.5)
    doc.line(135, footerY, 195, footerY) // Línea de firma

    doc.setFontSize(7)
    doc.setTextColor(107, 114, 128)
    doc.setFont("helvetica", "normal")
    doc.text('FIRMA AUTORIZADA', 165, footerY + 5, { align: 'center' })
    doc.text('ADMINISTRACIÓN UNIFORMES MASTER', 165, footerY + 10, { align: 'center' })

    // Texto legal final
    doc.setFontSize(7)
    doc.text('Este recibo es un comprobante oficial de pedido generado digitalmente.', 105, 285, { align: 'center' })
    doc.text('UNIFORMES MASTER - Plataforma Oficial', 105, 290, { align: 'center' })

    // Save PDF
    doc.save(`Orden_${order.customers?.name || 'Cliente'}.pdf`)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content advanced-modal">
        <div className="modal-header">
          <h2>Detalle de Pedido</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {!loading && <button onClick={handleCopyForWhatsApp} className="btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}><span style={{ color: '#25D366', fontSize: '1rem' }}>💬</span> Whatsapp</button>}
            {!loading && <button onClick={handleDownloadPDF} className="btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--brand-primary)', color: 'black' }}>📄 Descargar PDF</button>}
            {!loading && <button onClick={handleDeleteOrder} className="btn-remove" style={{ border: '1px solid #ff5555' }}>🗑️ Eliminar</button>}
            <button onClick={onClose} className="btn-close">×</button>
          </div>
        </div>

        <div className="modal-body">
          {loading ? (
            <p style={{ color: 'white' }}>Cargando datos del pedido...</p>
          ) : (
            <>
              <div className="tabs-header">
                <button className={`tab-btn ${activeTab === 'resumen' ? 'active' : ''}`} onClick={() => setActiveTab('resumen')}>Resumen</button>
                <button className={`tab-btn ${activeTab === 'nomina' ? 'active' : ''}`} onClick={() => setActiveTab('nomina')}>Nómina</button>
                <button className={`tab-btn ${activeTab === 'produccion' ? 'active' : ''}`} onClick={() => setActiveTab('produccion')}>Producción</button>
              </div>

              {activeTab === 'resumen' && (
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
                  {order?.delivery_date && (
                    <div className="summary-block">
                      <span className="label">📅 Entrega Pactada</span>
                      <strong style={{ color: '#facc15', fontSize: '1.1rem' }}>{order.delivery_date}</strong>
                    </div>
                  )}
                  <div className="summary-block highlight">
                    <span className="label">Finanzas</span>
                    <span>Total: <strong>${order?.total_price.toLocaleString('es-CO')}</strong></span>
                    <span>Abono: <strong className="text-primary">${order?.advance_payment.toLocaleString('es-CO')}</strong></span>
                    <span>Saldo: <strong className="text-red">${(order?.total_price - order?.advance_payment).toLocaleString('es-CO')}</strong></span>
                  </div>
                </div>
              )}

              {activeTab === 'produccion' && (
                <div className="observations-section" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 2, minWidth: '300px' }}>
                      <label className="label" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>Observaciones / Novedades</label>
                      <textarea 
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        placeholder="Ej: El dorsal 10 salió manchado, devolver a sublimación..."
                        style={{ width: '100%', height: '80px', padding: '0.5rem', background: '#111', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label className="label" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>Metros de Tela (Corel)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={fabricMeters}
                        onChange={(e) => setFabricMeters(e.target.value)}
                        placeholder="Ej: 200.5"
                        style={{ width: '100%', padding: '0.5rem', background: '#111', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', marginBottom: '1rem' }}
                      />
                      <button onClick={handleSaveMeta} disabled={isSavingMeta} className="btn-add" style={{ width: '100%' }}>
                        {isSavingMeta ? 'Guardando...' : 'Guardar Info'}
                      </button>
                    </div>
                  </div>

                  <div className="danger-zone" style={{ border: '1px solid #ff5555', padding: '1rem', borderRadius: '8px', background: 'rgba(255,0,0,0.05)' }}>
                    <h3 style={{ color: '#ff5555', marginTop: 0 }}>Zona de Peligro</h3>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Para eliminar este pedido, escribe la palabra <strong>ELIMINAR</strong> a continuación:</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <input 
                        type="text" 
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="ELIMINAR"
                        style={{ padding: '0.5rem', background: '#111', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}
                      />
                      <button 
                        onClick={handleDeleteOrder} 
                        className="btn-remove" 
                        style={{ opacity: deleteConfirmText === 'ELIMINAR' ? 1 : 0.5 }}
                        disabled={deleteConfirmText !== 'ELIMINAR'}
                      >
                        🗑️ Eliminar Definitivamente
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'nomina' && (
                <>
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
                            <td data-label="Jugador">{item.player_name}</td>
                            <td data-label="#">{item.player_number}</td>
                            <td data-label="Talla">{item.size}</td>
                            <td data-label="Item">{item.product_type}</td>
                            <td data-label="Precio" className="text-primary">${item.calculated_price.toLocaleString('es-CO')}</td>
                            <td data-label="Acción">
                              <button onClick={() => handleDeleteItem(item.id)} className="btn-remove">Eliminar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
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
        
        .observations-section { background: rgba(0,0,0,0.4); padding: 1.5rem; border-radius: 8px; border: 1px dashed rgba(255,255,255,0.2); }
        
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
        .btn-secondary { background: rgba(255,255,255,0.1); color: white; font-weight: 800; border: none; border-radius: 6px; cursor: pointer; text-transform: uppercase; }
        .btn-secondary:hover { background: rgba(255,255,255,0.2); }
        
        .tabs-header { display: flex; gap: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 1.5rem; }
        .tab-btn { background: none; border: none; color: rgba(255,255,255,0.5); padding: 0.5rem 1rem; cursor: pointer; font-weight: 700; border-bottom: 2px solid transparent; transition: 0.2s; }
        .tab-btn:hover { color: white; }
        .tab-btn.active { color: var(--brand-primary); border-bottom-color: var(--brand-primary); }
        
        .text-primary { color: var(--brand-primary); }
        .text-red { color: #ff5555; }
        
        @media (max-width: 600px) {
          .roster-table thead { display: none; }
          .roster-table, .roster-table tbody, .roster-table tr, .roster-table td { display: block; width: 100%; }
          .roster-table tr { margin-bottom: 1rem; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); }
          .roster-table td { text-align: right; padding-left: 50%; position: relative; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .roster-table td::before { content: attr(data-label); position: absolute; left: 0.8rem; width: 45%; text-align: left; font-weight: bold; color: rgba(255,255,255,0.5); }
        }
      `}</style>
    </div>
  )
}
