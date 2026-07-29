'use client'

import { useState } from 'react'
import KanbanBoard from '@/components/erp/KanbanBoard'
import NewOrderModal from '@/components/erp/NewOrderModal'

export default function VendedorDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Panel: <span style={{ color: 'var(--brand-primary)' }}>Trazabilidad de Producción</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0.5rem 0 0 0' }}>
            Gestiona el estado de todos los pedidos de la empresa en tiempo real.
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{
            background: 'var(--brand-primary)',
            color: '#000',
            fontWeight: 800,
            padding: '0.8rem 1.5rem',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          + Nuevo Pedido
        </button>
      </div>

      <KanbanBoard />

      {isModalOpen && (
        <NewOrderModal 
          onClose={() => setIsModalOpen(false)} 
          onCreated={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  )
}
