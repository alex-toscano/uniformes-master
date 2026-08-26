'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

type Order = {
  id: string
  created_at: string
  sku_reference: string
  quantity: number
  fabric_meters: number
  status: string
}

type Props = {
  customerId: string
  customerName: string
  onClose: () => void
}

export default function FabricReportModal({ customerId, customerName, onClose }: Props) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [daysFilter, setDaysFilter] = useState<number>(15)
  const [filterType, setFilterType] = useState<'preset' | 'custom'>('preset')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    fetchReport()
  }, [customerId, daysFilter, filterType, startDate, endDate])

  const fetchReport = async () => {
    setLoading(true)
    
    let query = supabase
      .from('orders')
      .select('id, created_at, sku_reference, quantity, fabric_meters, status')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (filterType === 'preset' && daysFilter !== 0) {
      const dateLimit = new Date()
      dateLimit.setDate(dateLimit.getDate() - daysFilter)
      query = query.gte('created_at', dateLimit.toISOString())
    } else if (filterType === 'custom') {
      if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00.000Z`)
      }
      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59.999Z`)
      }
    }

    const { data, error } = await query

    if (data && !error) {
      setOrders(data as Order[])
    }
    setLoading(false)
  }

  const totalFabric = orders.reduce((acc, curr) => acc + (curr.fabric_meters || 0), 0)
  const totalGarments = orders.reduce((acc, curr) => acc + (curr.quantity || 0), 0)

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2>📊 Reporte de Consumo de Tela</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>Cliente</p>
            <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--brand-primary)' }}>{customerName}</h3>
          </div>

          <div className="filter-controls" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>Tipo de Filtro:</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value as 'preset' | 'custom')} style={{ padding: '0.4rem', background: '#111', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}>
                <option value="preset">Rápido (Días)</option>
                <option value="custom">Personalizado (Calendario)</option>
              </select>
            </div>

            {filterType === 'preset' ? (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label style={{ color: 'rgba(255,255,255,0.7)' }}>Rango de tiempo:</label>
                <select value={daysFilter} onChange={(e) => setDaysFilter(Number(e.target.value))} style={{ padding: '0.4rem', background: '#111', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}>
                  <option value={7}>Últimos 7 días</option>
                  <option value={15}>Últimos 15 días</option>
                  <option value={30}>Último mes (30 días)</option>
                  <option value={90}>Últimos 3 meses</option>
                  <option value={0}>Histórico Completo (Todo)</option>
                </select>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ color: 'rgba(255,255,255,0.7)' }}>Desde:</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ padding: '0.4rem', background: '#111', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', colorScheme: 'dark' }}
                />
                <label style={{ color: 'rgba(255,255,255,0.7)' }}>Hasta:</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ padding: '0.4rem', background: '#111', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', colorScheme: 'dark' }}
                />
              </div>
            )}
          </div>

          <div className="metrics-row" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="metric-card" style={{ flex: 1, textAlign: 'center', padding: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'rgba(255,255,255,0.6)' }}>Total Pedidos</h4>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>{orders.length}</span>
            </div>
            <div className="metric-card" style={{ flex: 1, textAlign: 'center', padding: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'rgba(255,255,255,0.6)' }}>Prendas Totales</h4>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>{totalGarments}</span>
            </div>
            <div className="metric-card" style={{ flex: 1, textAlign: 'center', padding: '1.5rem', borderColor: 'var(--brand-primary)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'rgba(255,255,255,0.6)' }}>Metros de Tela (Total)</h4>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--brand-primary)' }}>{totalFabric.toFixed(2)} m</span>
            </div>
          </div>

          {loading ? (
            <p className="text-center">Cargando reporte...</p>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              No hay pedidos en este rango de tiempo.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="crm-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Diseño (SKU)</th>
                    <th>Estado</th>
                    <th>Prendas</th>
                    <th>Tela Usada</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td>{new Date(o.created_at).toLocaleDateString()}</td>
                      <td><strong>{o.sku_reference || 'S/N'}</strong></td>
                      <td>
                        <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                          {o.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>{o.quantity}</td>
                      <td style={{ color: 'var(--brand-primary)', fontWeight: 'bold' }}>{o.fabric_meters || 0} m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-content {
          background: #0a0a0a; border: 1px solid rgba(255,255,255,0.1);
          width: 95%; border-radius: 12px; max-height: 95vh;
          display: flex; flex-direction: column;
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); background: #111;
          border-radius: 12px 12px 0 0;
        }
        .modal-header h2 { margin: 0; color: white; }
        .btn-close { background: none; border: none; color: white; font-size: 2rem; cursor: pointer; }
        
        .modal-body { padding: 2rem; overflow-y: auto; flex: 1; }
        
        .filter-controls select {
          padding: 0.5rem 1rem;
          background: #1a1a1a;
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px;
          outline: none;
        }
        
        .metrics-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .metric-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; }
        
        .table-responsive { max-height: 300px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; }
        .crm-table { width: 100%; border-collapse: collapse; }
        .crm-table th { background: #1a1a1a; padding: 0.8rem; text-align: left; font-size: 0.8rem; color: rgba(255,255,255,0.5); position: sticky; top: 0; z-index: 10; }
        .crm-table td { padding: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: white; font-size: 0.9rem; }
      `}</style>
    </div>
  )
}
