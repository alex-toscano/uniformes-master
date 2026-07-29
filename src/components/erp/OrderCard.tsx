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
  delivery_date?: string
}

export default function OrderCard({ order, onUpdateStatus, onViewDetails }: { order: Order, onUpdateStatus: (id: string, newStatus: string) => void, onViewDetails?: (id: string) => void }) {
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

  // Días festivos en Colombia 2026 (Aproximados/Oficiales)
  const COLOMBIA_HOLIDAYS = [
    '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01', 
    '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07', 
    '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25',
    // 2025 restantes por si acaso
    '2025-08-07', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17', '2025-12-08', '2025-12-25'
  ]

  const getBusinessDaysDiff = (start: Date, end: Date) => {
    let count = 0
    let curDate = new Date(start.getTime())
    const sign = end >= start ? 1 : -1
    
    const limit = new Date(end.getTime())
    
    if (sign === 1) {
      while (curDate < limit) {
        curDate.setDate(curDate.getDate() + 1)
        const day = curDate.getDay()
        const dateStr = curDate.toISOString().split('T')[0]
        if (day !== 0 && day !== 6 && !COLOMBIA_HOLIDAYS.includes(dateStr)) {
          count++
        }
      }
    } else {
      while (curDate > limit) {
        curDate.setDate(curDate.getDate() - 1)
        const day = curDate.getDay()
        const dateStr = curDate.toISOString().split('T')[0]
        if (day !== 0 && day !== 6 && !COLOMBIA_HOLIDAYS.includes(dateStr)) {
          count--
        }
      }
    }
    return count
  }

  const getDeliveryStatus = () => {
    if (!order.delivery_date || order.status === 'entregado') return null
    
    const today = new Date()
    today.setHours(0,0,0,0)
    
    const [year, month, day] = order.delivery_date.split('-').map(Number)
    const delivery = new Date(year, month - 1, day)
    
    const diffDays = getBusinessDaysDiff(today, delivery)
    
    if (diffDays < 0) return { class: 'overdue', text: `Vencido hace ${Math.abs(diffDays)}d hábiles` }
    if (diffDays <= 2) return { class: 'danger', text: `¡Faltan ${diffDays}d hábiles!` }
    if (diffDays <= 5) return { class: 'warning', text: `${diffDays} días hábiles` }
    return { class: 'normal', text: `${diffDays} días hábiles` }
  }

  const deliveryStatus = getDeliveryStatus()

  return (
    <div className={`order-card ${deliveryStatus ? deliveryStatus.class : ''}`}>
      <div className="card-header">
        <span className="sku">{order.sku_reference}</span>
        <div style={{display: 'flex', gap: '0.5rem'}}>
          {deliveryStatus && (
            <span className={`delivery-badge ${deliveryStatus.class}`}>
              📅 {deliveryStatus.text}
            </span>
          )}
          <span className="qty">{order.quantity} un.</span>
        </div>
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

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {onViewDetails && (
          <button onClick={() => onViewDetails(order.id)} className="btn-view-details">
            👁️ Ver Detalle
          </button>
        )}
        
        {order.status !== 'entregado' && (
          <button onClick={handleNextPhase} className="btn-next-phase" style={{ flex: 1 }}>
            Siguiente ➔
          </button>
        )}
      </div>

      <style>{`
        .order-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 1rem;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .order-card:hover {
          border-color: rgba(212,255,0,0.3);
          transform: translateY(-2px);
        }
        .order-card.warning { border-color: rgba(250,204,21,0.5); }
        .order-card.danger { border-color: #ff5555; animation: pulse 1.5s infinite; }
        .order-card.overdue { border-color: #991b1b; background: rgba(153,27,27,0.1); }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255,85,85,0.4); background: rgba(255,255,255,0.03); }
          50% { box-shadow: 0 0 0 8px rgba(255,85,85,0); background: rgba(255,85,85,0.15); border-color: #ff1111; }
          100% { box-shadow: 0 0 0 0 rgba(255,85,85,0); background: rgba(255,255,255,0.03); }
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
        .delivery-badge { font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 4px; white-space: nowrap; }
        .delivery-badge.normal { background: rgba(255,255,255,0.1); color: white; }
        .delivery-badge.warning { background: rgba(250,204,21,0.2); color: #facc15; }
        .delivery-badge.danger { background: #ff5555; color: white; animation: badgePulse 1s infinite alternate; }
        .delivery-badge.overdue { background: #991b1b; color: white; }
        
        @keyframes badgePulse {
          from { transform: scale(1); opacity: 1; }
          to { transform: scale(1.05); opacity: 0.8; }
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
        .btn-view-details {
          background: rgba(255,255,255,0.05);
          color: white;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-view-details:hover {
          background: rgba(255,255,255,0.1);
        }
      `}</style>
    </div>
  )
}
