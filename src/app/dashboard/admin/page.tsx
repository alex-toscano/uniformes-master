'use client'

import { useState } from 'react'
import KanbanBoard from '@/components/erp/KanbanBoard'
import NewOrderModal from '@/components/erp/NewOrderModal'
import FabricReportModal from '@/components/erp/FabricReportModal'
import ProductCatalogModal from '@/components/erp/ProductCatalogModal'

export default function AdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFabricReportOpen, setIsFabricReportOpen] = useState(false)
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            fontSize: '0.75rem',
            fontWeight: 800,
            padding: '0.25rem 0.6rem',
            borderRadius: '4px',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            🛡️ Panel Gerencial de Operaciones
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Control de <span style={{ color: 'var(--brand-primary)' }}>Producción y Operaciones</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>
            Supervisa el flujo integral de pedidos, crea nuevas órdenes y consulta el historial de prendas entregadas.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsFabricReportOpen(true)}
            style={{
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#60a5fa',
              fontWeight: 800,
              padding: '0.85rem 1.4rem',
              borderRadius: '6px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            🧵 Reporte de Telas
          </button>

          <a
            href="/dashboard/finanzas"
            style={{
              background: 'rgba(212, 255, 0, 0.12)',
              color: 'var(--brand-primary)',
              fontWeight: 800,
              padding: '0.85rem 1.4rem',
              borderRadius: '6px',
              border: '1px solid rgba(212, 255, 0, 0.3)',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            💰 Panel Financiero
          </a>

          <button
            onClick={() => setIsCatalogOpen(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#fff',
              fontWeight: 800,
              padding: '0.85rem 1.4rem',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            🏷️ Catálogo y Precios
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            style={{
              background: 'var(--brand-primary)',
              color: '#000',
              fontWeight: 800,
              padding: '0.85rem 1.6rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(254, 240, 138, 0.2)'
            }}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>+</span> Nuevo Pedido
          </button>
        </div>
      </div>

      <KanbanBoard />

      {isModalOpen && (
        <NewOrderModal 
          onClose={() => setIsModalOpen(false)} 
          onCreated={() => setIsModalOpen(false)} 
        />
      )}

      {isFabricReportOpen && (
        <FabricReportModal 
          isGlobal={true}
          onClose={() => setIsFabricReportOpen(false)} 
        />
      )}

      {isCatalogOpen && (
        <ProductCatalogModal
          onClose={() => setIsCatalogOpen(false)}
        />
      )}
    </div>
  )
}
