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

  return (
    <div className="kanban-container">
      <div className="kanban-board">
        {COLUMNS.map(col => {
          const colOrders = orders.filter(o => o.status === col.id)
          return (
            <div key={col.id} className="kanban-col">
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
        .kanban-container {
          overflow-x: auto;
          padding-bottom: 1rem;
          height: calc(100vh - 200px);
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
