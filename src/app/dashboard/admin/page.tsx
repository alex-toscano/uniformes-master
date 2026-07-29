'use client'

import KanbanBoard from '@/components/erp/KanbanBoard'

export default function AdminDashboard() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
          Panel: <span style={{ color: 'var(--brand-primary)' }}>Visión General</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0.5rem 0 0 0' }}>
          Monitorea el estado de la producción y el desempeño general de la empresa.
        </p>
      </div>

      <KanbanBoard />
    </div>
  )
}
