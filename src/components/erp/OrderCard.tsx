'use client'

export type Order = {
  id: string
  customer_id: string
  customers?: { name: string; school_or_club: string; city: string }
  sku_reference: string
  quantity: number
  total_price: number
  advance_payment: number
  status: string
  created_by: string
  created_at: string
}

export default function OrderCard({ order, onUpdateStatus }: { order: Order, onUpdateStatus: (id: string, newStatus: string) => void }) {
  const nextStatusMap: Record<string, string> = {
    'cotizacion': 'diseño',
    'diseño': 'aprobacion_cliente',
    'aprobacion_cliente': 'produccion',
    'produccion': 'confeccion_y_duplicado',
    'confeccion_y_duplicado': 'control_calidad',
    'control_calidad': 'entregado',
    'entregado': 'entregado'
  }

  const handleNextPhase = () => {
    if (order.status !== 'entregado') {
      onUpdateStatus(order.id, nextStatusMap[order.status])
    }
  }

  return (
    <div className="order-card">
      <div className="card-header">
        <span className="sku">{order.sku_reference}</span>
        <span className="qty">{order.quantity} un.</span>
      </div>
      <h3 className="school-name">{order.customers?.school_or_club || 'Sin Club'}</h3>
      <p className="client-name">{order.customers?.name} • {order.customers?.city}</p>
      
      <div className="finance">
        <div className="finance-item">
          <span>Total:</span>
          <strong>${order.total_price.toLocaleString('es-CO')}</strong>
        </div>
        <div className="finance-item">
          <span>Abono:</span>
          <strong className="text-primary">${order.advance_payment.toLocaleString('es-CO')}</strong>
        </div>
      </div>

      {order.status !== 'entregado' && (
        <button onClick={handleNextPhase} className="btn-next-phase">
          Mover a siguiente fase ➔
        </button>
      )}

      <style>{`
        .order-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 1rem;
          transition: border-color 0.2s, transform 0.2s;
        }
        .order-card:hover {
          border-color: rgba(212,255,0,0.3);
          transform: translateY(-2px);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .sku {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--brand-primary);
          letter-spacing: 1px;
        }
        .qty {
          font-size: 0.75rem;
          background: rgba(255,255,255,0.1);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }
        .school-name {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0 0 0.2rem 0;
          color: white;
        }
        .client-name {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
          margin-bottom: 1rem;
        }
        .finance {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          background: rgba(0,0,0,0.4);
          padding: 0.5rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        .finance-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
        }
        .text-primary {
          color: var(--brand-primary);
        }
        .btn-next-phase {
          width: 100%;
          background: rgba(255,255,255,0.05);
          color: white;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-next-phase:hover {
          background: var(--brand-primary);
          color: black;
          border-color: var(--brand-primary);
        }
      `}</style>
    </div>
  )
}
