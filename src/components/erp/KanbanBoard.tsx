'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import OrderCard, { Order } from './OrderCard'
import OrderDetailsModal from './OrderDetailsModal'

const ACTIVE_COLUMNS = [
  { id: 'cotizacion', label: 'Cotización', icon: '📋' },
  { id: 'diseño', label: 'Diseño', icon: '🎨' },
  { id: 'aprobacion_cliente', label: 'Aprobación', icon: '✍️' },
  { id: 'produccion', label: 'Producción', icon: '🏭' },
  { id: 'confeccion_y_duplicado', label: 'Confección', icon: '✂️' },
  { id: 'control_calidad', label: 'Control Calidad', icon: '🔍' }
]

export default function KanbanBoard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'activos' | 'entregados'>('activos')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [deliveredSearch, setDeliveredSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [isDragOverDropZone, setIsDragOverDropZone] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const supabase = createClient()

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers (
          name, school_or_club, city
        )
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data as Order[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
    
    const handleSync = () => {
      fetchOrders()
    }
    window.addEventListener('orders-updated', handleSync)

    // Configurar realtime para mantener sincronizados todos los turnos
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      window.removeEventListener('orders-updated', handleSync)
      supabase.removeChannel(channel)
    }
  }, [])

  const updateOrderStatus = async (id: string, newStatus: string) => {
    const targetOrder = orders.find(o => o.id === id)
    // Optimistic UI update para que se sienta instantáneo
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o))
    
    if (newStatus === 'entregado') {
      showToast(`📦 Pedido "${targetOrder?.sku_reference || ''}" marcado como ENTREGADO y archivado en Historial.`)
    } else if (targetOrder?.status === 'entregado') {
      showToast(`↩️ Pedido "${targetOrder?.sku_reference || ''}" regresado al Tablero de Producción.`)
    }

    // Actualización real en BD
    await supabase.from('orders').update({ status: newStatus }).eq('id', id)
  }

  if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Cargando información de pedidos...</div>

  // Separar pedidos activos de los entregados
  const activeOrders = orders.filter(o => o.status !== 'entregado')
  const deliveredOrders = orders.filter(o => o.status === 'entregado')

  const getCleanObservations = (obs?: string) => {
    if (!obs) return ''
    return obs.replace(/^\[TELA:\s*([^[\]\n]+)\]\n?/i, '').trim()
  }

  const productionOrdersWithObs = activeOrders.filter(
    o => o.status === 'produccion' && getCleanObservations(o.observations) !== ''
  )

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    e.preventDefault()
    setIsDragOverDropZone(false)
    const orderId = e.dataTransfer.getData('orderId')
    if (orderId) {
      await updateOrderStatus(orderId, newStatus)
    }
  }

  // Filtrado de pedidos entregados
  const filteredDelivered = deliveredOrders.filter(order => {
    const search = deliveredSearch.toLowerCase()
    const matchesSearch =
      order.sku_reference.toLowerCase().includes(search) ||
      (order.customers?.name || '').toLowerCase().includes(search) ||
      (order.customers?.school_or_club || '').toLowerCase().includes(search) ||
      (order.customers?.city || '').toLowerCase().includes(search)

    const balance = (order.total_price || 0) - (order.advance_payment || 0)
    const matchesPayment =
      paymentFilter === 'all'
        ? true
        : paymentFilter === 'paid'
        ? balance <= 0
        : balance > 0

    return matchesSearch && matchesPayment
  })

  // Totales de entregados
  const totalDeliveredGarments = deliveredOrders.reduce((sum, o) => sum + (o.quantity || 0), 0)
  const totalDeliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total_price || 0), 0)
  const totalDeliveredPendingBalance = deliveredOrders.reduce((sum, o) => sum + Math.max(0, (o.total_price || 0) - (o.advance_payment || 0)), 0)

  return (
    <div className="kanban-wrapper">
      {/* Toast */}
      {toastMessage && (
        <div className="toast-kanban">
          {toastMessage}
        </div>
      )}

      {/* Selector de Pestañas (Tab Switcher) */}
      <div className="tab-switcher">
        <button 
          className={`tab-btn ${activeTab === 'activos' ? 'active' : ''}`}
          onClick={() => setActiveTab('activos')}
        >
          <span className="tab-icon">🏭</span>
          <span>Tablero de Producción (En Proceso)</span>
          <span className="tab-badge-count count-active">{activeOrders.length}</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'entregados' ? 'active' : ''}`}
          onClick={() => setActiveTab('entregados')}
        >
          <span className="tab-icon">📦</span>
          <span>Historial de Entregados</span>
          <span className="tab-badge-count count-delivered">{deliveredOrders.length}</span>
        </button>
      </div>

      {/* VISTA 1: TABLERO ACTIVO */}
      {activeTab === 'activos' && (
        <div className="kanban-container">
          {/* Zona de Entrega Rápida por Drag & Drop */}
          <div 
            className={`delivery-drop-zone ${isDragOverDropZone ? 'drag-active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOverDropZone(true) }}
            onDragLeave={() => setIsDragOverDropZone(false)}
            onDrop={(e) => handleDrop(e, 'entregado')}
          >
            <span className="drop-icon">📦</span>
            <div className="drop-text">
              <strong>Zona de Entrega Rápida</strong>
              <span>Arrastra cualquier pedido aquí para marcarlo como ENTREGADO y archivarlo fuera del tablero</span>
            </div>
          </div>

          {productionOrdersWithObs.length > 0 && (
            <div className="production-banner">
              <h3>⚠️ Novedades en Producción</h3>
              <ul>
                {productionOrdersWithObs.map(o => (
                  <li key={o.id}>
                    <strong>{o.sku_reference || 'Sin SKU'} ({o.customers?.school_or_club || o.customers?.name}):</strong> {getCleanObservations(o.observations)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="kanban-board">
            {ACTIVE_COLUMNS.map(col => {
              const colOrders = activeOrders.filter(o => o.status === col.id)
              return (
                <div 
                  key={col.id} 
                  className="kanban-col"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                >
                  <div className="col-header">
                    <div className="col-title-wrap">
                      <span className="col-icon">{col.icon}</span>
                      <h3>{col.label}</h3>
                    </div>
                    <span className="col-count">{colOrders.length}</span>
                  </div>
                  <div className="col-cards">
                    {colOrders.length === 0 ? (
                      <div className="empty-col-placeholder">Sin pedidos</div>
                    ) : (
                      colOrders.map(order => (
                        <OrderCard 
                          key={order.id} 
                          order={order} 
                          onUpdateStatus={updateOrderStatus} 
                          onViewDetails={setSelectedOrderId}
                        />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* VISTA 2: HISTORIAL DE ENTREGADOS */}
      {activeTab === 'entregados' && (
        <div className="delivered-container">
          {/* Métricas de Entregas */}
          <div className="delivered-metrics">
            <div className="metric-box">
              <span className="metric-icon">📦</span>
              <div>
                <div className="metric-label">Pedidos Entregados</div>
                <div className="metric-value">{deliveredOrders.length}</div>
              </div>
            </div>

            <div className="metric-box">
              <span className="metric-icon">👕</span>
              <div>
                <div className="metric-label">Prendas Fabricadas</div>
                <div className="metric-value" style={{ color: 'var(--brand-primary)' }}>{totalDeliveredGarments} un.</div>
              </div>
            </div>

            <div className="metric-box">
              <span className="metric-icon">💵</span>
              <div>
                <div className="metric-label">Facturado en Entregas</div>
                <div className="metric-value" style={{ color: '#10b981' }}>${totalDeliveredRevenue.toLocaleString('es-CO')}</div>
              </div>
            </div>

            <div className="metric-box" style={totalDeliveredPendingBalance > 0 ? { borderColor: 'rgba(239, 68, 68, 0.4)' } : {}}>
              <span className="metric-icon">⚠️</span>
              <div>
                <div className="metric-label">Saldos por Cobrar al Entregar</div>
                <div className="metric-value" style={{ color: totalDeliveredPendingBalance > 0 ? '#ef4444' : '#9ca3af' }}>
                  ${totalDeliveredPendingBalance.toLocaleString('es-CO')}
                </div>
              </div>
            </div>
          </div>

          {/* Filtros de Historial */}
          <div className="delivered-filter-bar">
            <div className="delivered-search">
              <span>🔍</span>
              <input 
                type="text"
                placeholder="Buscar en entregados por SKU, cliente o colegio..."
                value={deliveredSearch}
                onChange={e => setDeliveredSearch(e.target.value)}
              />
              {deliveredSearch && (
                <button onClick={() => setDeliveredSearch('')}>✕</button>
              )}
            </div>

            <div className="delivered-payment-filter">
              <label>Cobro:</label>
              <select 
                value={paymentFilter} 
                onChange={(e: any) => setPaymentFilter(e.target.value)}
              >
                <option value="all">Todos los cobros</option>
                <option value="paid">✅ 100% Pagados</option>
                <option value="pending">⚠️ Con Saldo Pendiente</option>
              </select>
            </div>
          </div>

          {/* Tabla de Entregados */}
          {filteredDelivered.length === 0 ? (
            <div className="delivered-empty">
              <p className="empty-title">No hay pedidos entregados en este criterio</p>
              <p className="empty-desc">Los pedidos marcados como "Entregado" en el tablero activo aparecerán archivados aquí automáticamente.</p>
            </div>
          ) : (
            <div className="delivered-table-card">
              <table className="delivered-table">
                <thead>
                  <tr>
                    <th>Fecha Registro</th>
                    <th>SKU / Referencia</th>
                    <th>Cliente / Colegio</th>
                    <th>Prendas</th>
                    <th>Total & Cobro</th>
                    <th>Estado de Pago</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDelivered.map(order => {
                    const balance = (order.total_price || 0) - (order.advance_payment || 0)
                    const isFullyPaid = balance <= 0

                    return (
                      <tr key={order.id}>
                        <td className="cell-date">
                          {new Date(order.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="cell-sku">
                          <strong>{order.sku_reference}</strong>
                        </td>
                        <td>
                          <div className="customer-cell">
                            <strong>{order.customers?.school_or_club || 'Sin Colegio'}</strong>
                            <small>{order.customers?.name} • {order.customers?.city}</small>
                          </div>
                        </td>
                        <td>
                          <span className="qty-tag">{order.quantity} unidades</span>
                        </td>
                        <td>
                          <div className="money-cell">
                            <span className="total-val">${order.total_price?.toLocaleString('es-CO')}</span>
                            <span className="advance-val">Abono: ${order.advance_payment?.toLocaleString('es-CO')}</span>
                          </div>
                        </td>
                        <td>
                          {isFullyPaid ? (
                            <span className="badge-paid">✅ Pagado Total</span>
                          ) : (
                            <span className="badge-pending">⚠️ Debe: ${balance.toLocaleString('es-CO')}</span>
                          )}
                        </td>
                        <td>
                          <div className="delivered-actions">
                            <button 
                              onClick={() => setSelectedOrderId(order.id)}
                              className="btn-delivered-detail"
                              title="Ver ficha técnica y remisión"
                            >
                              👁️ Ficha / PDF
                            </button>

                            <button 
                              onClick={() => {
                                if (confirm(`¿Regresar el pedido ${order.sku_reference} al tablero activo de Control de Calidad?`)) {
                                  updateOrderStatus(order.id, 'control_calidad')
                                }
                              }}
                              className="btn-delivered-restore"
                              title="Reabrir pedido y devolverlo al tablero activo"
                            >
                              ↩️ Devolver
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedOrderId && (
        <OrderDetailsModal 
          orderId={selectedOrderId} 
          onClose={() => setSelectedOrderId(null)} 
          onOrderDeleted={(deletedId) => {
            setOrders(prev => prev.filter(o => o.id !== deletedId))
            setSelectedOrderId(null)
          }}
          onOrderUpdated={fetchOrders}
        />
      )}

      <style>{`
        .kanban-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          gap: 1rem;
        }

        .toast-kanban {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #064e3b;
          color: #34d399;
          border: 1px solid #059669;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.95rem;
          z-index: 10000;
          box-shadow: 0 10px 30px rgba(0,0,0,0.6);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* Tab Switcher */
        .tab-switcher {
          display: flex;
          gap: 0.8rem;
          background: rgba(255, 255, 255, 0.03);
          padding: 0.4rem;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          width: fit-content;
          flex-wrap: wrap;
        }

        .tab-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          padding: 0.65rem 1.2rem;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .tab-btn.active {
          background: var(--brand-primary);
          color: #000;
          box-shadow: 0 2px 10px rgba(212, 255, 0, 0.25);
        }

        .tab-badge-count {
          font-size: 0.75rem;
          padding: 0.15rem 0.5rem;
          border-radius: 20px;
          font-weight: 900;
        }

        .tab-btn.active .tab-badge-count {
          background: #000;
          color: #fff;
        }

        .tab-btn:not(.active) .count-active {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .tab-btn:not(.active) .count-delivered {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        /* Zona de Entrega Drag & Drop */
        .delivery-drop-zone {
          background: rgba(16, 185, 129, 0.06);
          border: 2px dashed rgba(16, 185, 129, 0.3);
          border-radius: 8px;
          padding: 0.9rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          color: #a7f3d0;
          transition: all 0.2s;
        }
        .delivery-drop-zone.drag-active {
          background: rgba(16, 185, 129, 0.2);
          border-color: #10b981;
          transform: scale(1.01);
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        }
        .drop-icon {
          font-size: 1.8rem;
        }
        .drop-text {
          display: flex;
          flex-direction: column;
          font-size: 0.85rem;
        }
        .drop-text strong {
          color: #34d399;
          font-size: 0.95rem;
        }
        .drop-text span {
          color: rgba(255, 255, 255, 0.6);
        }

        /* Kanban Layout */
        .kanban-container {
          overflow-x: auto;
          padding-bottom: 1rem;
          height: calc(100vh - 220px);
          display: flex;
          flex-direction: column;
        }
        .kanban-board {
          display: flex;
          gap: 1rem;
          height: 100%;
          min-width: max-content;
        }
        .kanban-col {
          width: 310px;
          background: rgba(255,255,255,0.015);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .col-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.9rem 1.1rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(0,0,0,0.3);
        }
        .col-title-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .col-header h3 {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          font-weight: 800;
          color: white;
          margin: 0;
        }
        .col-count {
          background: rgba(255,255,255,0.1);
          padding: 0.2rem 0.55rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 800;
          color: rgba(255,255,255,0.8);
        }
        .col-cards {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          overflow-y: auto;
          flex: 1;
        }
        .empty-col-placeholder {
          text-align: center;
          padding: 2rem 1rem;
          color: rgba(255,255,255,0.25);
          font-size: 0.85rem;
          font-style: italic;
        }

        .production-banner {
          background: rgba(255, 85, 85, 0.1);
          border: 1px solid #ff5555;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
          color: white;
        }
        .production-banner h3 { margin: 0 0 0.5rem 0; color: #ff5555; font-size: 1rem; }
        .production-banner ul { margin: 0; padding-left: 1.5rem; font-size: 0.85rem; }
        .production-banner li { margin-bottom: 0.3rem; }

        /* Delivered View */
        .delivered-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding-bottom: 2rem;
        }

        .delivered-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 1rem;
        }

        .metric-box {
          background: #0d0d0d;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 1.2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .metric-icon {
          font-size: 1.6rem;
        }
        .metric-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .metric-value {
          font-size: 1.4rem;
          font-weight: 900;
          color: #fff;
          margin-top: 0.2rem;
        }

        .delivered-filter-bar {
          background: #0d0d0d;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 0.8rem 1.2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .delivered-search {
          flex: 1;
          min-width: 250px;
          position: relative;
          display: flex;
          align-items: center;
        }
        .delivered-search span {
          position: absolute;
          left: 0.8rem;
          color: rgba(255,255,255,0.4);
        }
        .delivered-search input {
          width: 100%;
          background: #181818;
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 0.65rem 2rem 0.65rem 2.2rem;
          border-radius: 6px;
          font-size: 0.9rem;
        }
        .delivered-search input:focus {
          outline: none;
          border-color: var(--brand-primary);
        }
        .delivered-search button {
          position: absolute;
          right: 0.6rem;
          background: none;
          border: none;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
        }

        .delivered-payment-filter {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: rgba(255,255,255,0.6);
        }
        .delivered-payment-filter select {
          background: #181818;
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 0.6rem 0.8rem;
          border-radius: 6px;
          font-size: 0.85rem;
        }

        .delivered-table-card {
          background: #0d0d0d;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          overflow-x: auto;
        }

        .delivered-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .delivered-table th {
          background: #121212;
          padding: 1rem 1.2rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255,255,255,0.5);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .delivered-table td {
          padding: 1rem 1.2rem;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          vertical-align: middle;
        }
        .delivered-table tr:hover {
          background: rgba(255,255,255,0.02);
        }

        .cell-date {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
        }
        .cell-sku {
          color: var(--brand-primary);
          font-size: 0.9rem;
          letter-spacing: 0.5px;
        }

        .customer-cell {
          display: flex;
          flex-direction: column;
        }
        .customer-cell strong {
          color: #fff;
          font-size: 0.9rem;
        }
        .customer-cell small {
          color: rgba(255,255,255,0.5);
          font-size: 0.8rem;
        }

        .qty-tag {
          background: rgba(255,255,255,0.08);
          padding: 0.25rem 0.6rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #fff;
        }

        .money-cell {
          display: flex;
          flex-direction: column;
        }
        .total-val {
          font-weight: 800;
          color: #fff;
        }
        .advance-val {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
        }

        .badge-paid {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 0.25rem 0.6rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 800;
        }

        .badge-pending {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 0.25rem 0.6rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 800;
        }

        .delivered-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.5rem;
        }

        .btn-delivered-detail {
          background: rgba(255,255,255,0.06);
          color: white;
          border: 1px solid rgba(255,255,255,0.12);
          padding: 0.45rem 0.8rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-delivered-detail:hover {
          background: rgba(255,255,255,0.15);
        }

        .btn-delivered-restore {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.25);
          padding: 0.45rem 0.8rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-delivered-restore:hover {
          background: #f59e0b;
          color: #000;
        }

        .delivered-empty {
          text-align: center;
          padding: 4rem 2rem;
          color: rgba(255,255,255,0.5);
          background: #0d0d0d;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .empty-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 0.3rem;
        }
        .empty-desc {
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  )
}
