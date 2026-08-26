'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import OrderCard, { Order } from './OrderCard'
import OrderDetailsModal from './OrderDetailsModal'

const COLUMNS = [
  { id: 'cotizacion', label: 'Cotización' },
  { id: 'diseño', label: 'Diseño' },
  { id: 'aprobacion_cliente', label: 'Aprobación' },
  { id: 'produccion', label: 'Producción' },
  { id: 'confeccion_y_duplicado', label: 'Confección' },
  { id: 'control_calidad', label: 'Calidad' },
  { id: 'entregado', label: 'Entregado' }
]

export default function KanbanBoard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const supabase = createClient()

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
    
    // Configurar realtime para mantener sincronizados todos los turnos
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const updateOrderStatus = async (id: string, newStatus: string) => {
    // Optimistic UI update para que se sienta instantáneo
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o))
    
    // Actualización real en BD
    await supabase.from('orders').update({ status: newStatus }).eq('id', id)
  }

  if (loading) return <div style={{ color: 'white' }}>Cargando tablero...</div>
  
  const productionOrdersWithObs = orders.filter(o => o.status === 'produccion' && o.observations && o.observations.trim() !== '')

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    e.preventDefault()
    const orderId = e.dataTransfer.getData('orderId')
    if (orderId) {
      await updateOrderStatus(orderId, newStatus)
    }
  }

  return (
    <div className="kanban-container">
      {productionOrdersWithObs.length > 0 && (
        <div className="production-banner">
          <h3>⚠️ Novedades en Producción</h3>
          <ul>
            {productionOrdersWithObs.map(o => (
              <li key={o.id}>
                <strong>{o.sku_reference || 'Sin SKU'} ({o.customers?.school_or_club || o.customers?.name}):</strong> {o.observations}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="kanban-board">
        {COLUMNS.map(col => {
          const colOrders = orders.filter(o => o.status === col.id)
          return (
            <div 
              key={col.id} 
              className="kanban-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="col-header">
                <h3>{col.label}</h3>
                <span className="col-count">{colOrders.length}</span>
              </div>
              <div className="col-cards">
                {colOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onUpdateStatus={updateOrderStatus} 
                    onViewDetails={setSelectedOrderId}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {selectedOrderId && (
        <OrderDetailsModal 
          orderId={selectedOrderId} 
          onClose={() => setSelectedOrderId(null)} 
        />
      )}

      <style>{`
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
        
        .kanban-container {
          overflow-x: auto;
          padding-bottom: 1rem;
          height: calc(100vh - 200px);
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
          width: 300px;
          background: rgba(255,255,255,0.01);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
        }
        .col-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(0,0,0,0.2);
        }
        .col-header h3 {
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 800;
          color: white;
          margin: 0;
        }
        .col-count {
          background: rgba(255,255,255,0.1);
          padding: 0.2rem 0.6rem;
          border-radius: 12px;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.7);
        }
        .col-cards {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          overflow-y: auto;
          flex: 1;
        }
        .col-cards::-webkit-scrollbar {
          width: 4px;
        }
        .col-cards::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}
