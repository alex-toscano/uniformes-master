'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { formatThousands, parseThousands } from '@/utils/formatters'

type Order = {
  id: string
  created_at: string
  sku_reference: string
  quantity: number
  fabric_meters: number
  status: string
  observations?: string
  customer_id?: string
  customers?: {
    name?: string
    school_or_club?: string
    city?: string
  } | null
}

type Props = {
  customerId?: string | null
  customerName?: string | null
  isGlobal?: boolean
  onClose: () => void
}

const FABRIC_TYPES = ['Montelín', 'Cerro', 'Súper Nylon', 'Otros'] as const
type FabricType = typeof FABRIC_TYPES[number]

export default function FabricReportModal({ customerId, customerName, isGlobal = false, onClose }: Props) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [daysFilter, setDaysFilter] = useState<number>(30)
  const [filterType, setFilterType] = useState<'preset' | 'custom'>('preset')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string>('all')
  const [uniqueCustomers, setUniqueCustomers] = useState<{ id: string; name: string }[]>([])
  
  // Costos por metro configurables por tela
  const [costsPerMeter, setCostsPerMeter] = useState<Record<string, number>>({
    'Montelín': 18000,
    'Cerro': 16000,
    'Súper Nylon': 22000,
    'Otros': 20000
  })

  const supabase = createClient()

  // Cargar costos guardados en localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('erp_fabric_costs_per_meter')
      if (saved) {
        setCostsPerMeter(JSON.parse(saved))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleUpdateCost = (fabric: string, rawVal: string) => {
    const num = parseThousands(rawVal)
    const updated = { ...costsPerMeter, [fabric]: num }
    setCostsPerMeter(updated)
    try {
      localStorage.setItem('erp_fabric_costs_per_meter', JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [customerId, isGlobal, daysFilter, filterType, startDate, endDate])

  const fetchReport = async () => {
    setLoading(true)
    
    let query = supabase
      .from('orders')
      .select('id, created_at, sku_reference, quantity, fabric_meters, status, observations, customer_id, customers(name, school_or_club, city)')
      .order('created_at', { ascending: false })

    if (!isGlobal && customerId) {
      query = query.eq('customer_id', customerId)
    }

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
      const rawList = data as unknown as any[]
      const fetched: Order[] = rawList.map(o => ({
        ...o,
        customers: Array.isArray(o.customers) ? o.customers[0] : o.customers
      }))
      setOrders(fetched)

      // Extraer lista de clientes para filtro en modo global
      const custMap = new Map<string, string>()
      fetched.forEach(o => {
        if (o.customer_id && o.customers?.name) {
          custMap.set(o.customer_id, o.customers.name)
        }
      })
      setUniqueCustomers(Array.from(custMap.entries()).map(([id, name]) => ({ id, name })))
    }
    setLoading(false)
  }

  // Filtrado de cliente opcional en modo global
  const filteredOrders = selectedCustomerFilter === 'all' 
    ? orders 
    : orders.filter(o => o.customer_id === selectedCustomerFilter)

  // Función para determinar el tipo de tela y descripción de un pedido
  const parseOrderFabric = (obs?: string) => {
    if (!obs) return { type: 'Montelín', description: '' }
    const match = obs.match(/^\[TELA:\s*([^[\]\n]+)\]/i)
    if (!match) return { type: 'Montelín', description: '' }
    
    const parsed = match[1].trim()
    if (parsed.toLowerCase().startsWith('otros')) {
      const parts = parsed.split(/-(.+)/)
      return { type: 'Otros', description: parts[1]?.trim() || '' }
    }
    if (parsed.toLowerCase().includes('cerro')) {
      return { type: 'Cerro', description: '' }
    }
    if (parsed.toLowerCase().includes('super') || parsed.toLowerCase().includes('nylon')) {
      return { type: 'Súper Nylon', description: '' }
    }
    return { type: 'Montelín', description: '' }
  }

  // Agrupación por tipo de tela
  const fabricStats: Record<FabricType, { meters: number; ordersCount: number; descriptions: Set<string> }> = {
    'Montelín': { meters: 0, ordersCount: 0, descriptions: new Set() },
    'Cerro': { meters: 0, ordersCount: 0, descriptions: new Set() },
    'Súper Nylon': { meters: 0, ordersCount: 0, descriptions: new Set() },
    'Otros': { meters: 0, ordersCount: 0, descriptions: new Set() }
  }

  let totalMetersAll = 0
  let totalGarments = 0

  filteredOrders.forEach(o => {
    const { type, description } = parseOrderFabric(o.observations)
    const validKey = (FABRIC_TYPES.includes(type as any) ? type : 'Otros') as FabricType
    const meters = o.fabric_meters || 0
    
    fabricStats[validKey].meters += meters
    fabricStats[validKey].ordersCount += 1
    if (description) {
      fabricStats[validKey].descriptions.add(description)
    }

    totalMetersAll += meters
    totalGarments += o.quantity || 0
  })

  // Total a pagar al proveedor de telas
  let totalCostToPay = 0
  FABRIC_TYPES.forEach(ft => {
    const costPerMeter = costsPerMeter[ft] || 0
    totalCostToPay += fabricStats[ft].meters * costPerMeter
  })

  const handleCopySummaryWhatsApp = () => {
    let text = `*🧵 REPORTE DE LIQUIDACIÓN DE TELAS*\n`
    text += `*EMPRESA: UNIFORMES MASTER*\n`
    text += isGlobal ? `*Alcance:* Global de Producción\n` : `*Cliente:* ${customerName}\n`
    text += `*Período:* ${filterType === 'preset' ? (daysFilter === 0 ? 'Histórico Completo' : `Últimos ${daysFilter} días`) : `${startDate || 'Inicio'} hasta ${endDate || 'Hoy'}`}\n`
    text += `------------------------------------\n`

    FABRIC_TYPES.forEach(ft => {
      const stats = fabricStats[ft]
      if (stats.meters > 0 || stats.ordersCount > 0) {
        const cost = costsPerMeter[ft] || 0
        const subtotal = stats.meters * cost
        text += `• *${ft.toUpperCase()}*:\n`
        text += `   - Consumo: ${stats.meters.toFixed(2)} metros (${stats.ordersCount} pedidos)\n`
        text += `   - Costo/metro: $${cost.toLocaleString('es-CO')}\n`
        text += `   - Subtotal: $${subtotal.toLocaleString('es-CO')}\n`
        if (ft === 'Otros' && stats.descriptions.size > 0) {
          text += `   - Especificaciones: ${Array.from(stats.descriptions).join(', ')}\n`
        }
      }
    })

    text += `------------------------------------\n`
    text += `*TOTAL METROS CONSUMIDOS:* ${totalMetersAll.toFixed(2)} m\n`
    text += `*VALOR TOTAL A PAGAR AL PROVEEDOR:* $${totalCostToPay.toLocaleString('es-CO')} COP\n`
    text += `Total Prendas Fabricadas: ${totalGarments} uds\n`

    navigator.clipboard.writeText(text)
    alert('✅ Resumen de telas y liquidación copiado al portapapeles para WhatsApp')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content advanced-fabric-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>🧵 {isGlobal ? 'Reporte Global de Consumo de Telas' : 'Reporte de Telas del Cliente'}</h2>
            <p style={{ margin: '0.3rem 0 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
              {isGlobal 
                ? 'Consolidado general para compras, control de taller y liquidación de costos de proveedores' 
                : `Detalle exclusivo de telas para: ${customerName}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <button onClick={handleCopySummaryWhatsApp} className="btn-secondary" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', padding: '0.5rem 1rem' }}>
              <span style={{ color: '#25D366' }}>💬</span> Copiar Liquidación
            </button>
            <button onClick={onClose} className="btn-close">×</button>
          </div>
        </div>

        <div className="modal-body">
          {/* Controles de Filtrado */}
          <div className="filter-controls-box">
            <div className="filter-row">
              <div className="filter-item">
                <label>Rango de Tiempo:</label>
                <select 
                  value={filterType === 'preset' ? daysFilter : 'custom'} 
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setFilterType('custom')
                    } else {
                      setFilterType('preset')
                      setDaysFilter(Number(e.target.value))
                    }
                  }}
                >
                  <option value={7}>Últimos 7 días</option>
                  <option value={15}>Últimos 15 días</option>
                  <option value={30}>Último mes (30 días)</option>
                  <option value={90}>Últimos 3 meses</option>
                  <option value={0}>Histórico Completo (Todo)</option>
                  <option value="custom">Personalizado (Calendario)</option>
                </select>
              </div>

              {filterType === 'custom' && (
                <>
                  <div className="filter-item">
                    <label>Desde:</label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="filter-item">
                    <label>Hasta:</label>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              {isGlobal && uniqueCustomers.length > 0 && (
                <div className="filter-item" style={{ flex: 1.5 }}>
                  <label>Filtrar por Cliente:</label>
                  <select 
                    value={selectedCustomerFilter} 
                    onChange={(e) => setSelectedCustomerFilter(e.target.value)}
                  >
                    <option value="all">-- Todos los Clientes ({uniqueCustomers.length}) --</option>
                    {uniqueCustomers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Tarjetas KPI Superiores */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-label">Pedidos en Período</span>
              <strong className="kpi-val">{filteredOrders.length}</strong>
              <span className="kpi-sub">{totalGarments} prendas fabricadas</span>
            </div>

            <div className="kpi-card highlight-meters">
              <span className="kpi-label">Metros Totales de Tela</span>
              <strong className="kpi-val text-primary">{totalMetersAll.toFixed(2)} m</strong>
              <span className="kpi-sub">Suma Corel en todos los pedidos</span>
            </div>

            <div className="kpi-card highlight-cost">
              <span className="kpi-label">💰 Total a Pagar al Proveedor</span>
              <strong className="kpi-val text-green">${totalCostToPay.toLocaleString('es-CO')}</strong>
              <span className="kpi-sub">Calculado según costo/metro configurado</span>
            </div>
          </div>

          {/* SECCIÓN PRINCIPAL: TABLA DE LIQUIDACIÓN Y COSTOS POR TELA */}
          <div className="section-block">
            <div className="block-header">
              <h3>🧵 Liquidación por Tipo de Tela y Costos de Proveedor</h3>
              <span className="hint">Ingresa o ajusta el costo por metro suministrado por tu distribuidor para calcular el pago exacto:</span>
            </div>

            <div className="table-wrapper">
              <table className="fabric-table">
                <thead>
                  <tr>
                    <th>Tipo de Tela</th>
                    <th>Especificación / Nota</th>
                    <th className="text-center">Pedidos</th>
                    <th className="text-right">Metros Consumidos</th>
                    <th className="text-right" style={{ width: '180px' }}>Costo Proveedor / Metro</th>
                    <th className="text-right">Total a Pagar</th>
                  </tr>
                </thead>
                <tbody>
                  {FABRIC_TYPES.map(ft => {
                    const stats = fabricStats[ft]
                    const costPerM = costsPerMeter[ft] || 0
                    const subtotal = stats.meters * costPerM
                    const descList = Array.from(stats.descriptions).filter(Boolean).join(', ')

                    return (
                      <tr key={ft} className={stats.meters > 0 ? 'active-fabric-row' : ''}>
                        <td>
                          <span className={`fabric-badge badge-${ft.toLowerCase().replace(/[^a-z]/g, '')}`}>
                            {ft}
                          </span>
                        </td>
                        <td style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                          {ft === 'Otros' 
                            ? (descList ? `Telas: ${descList}` : 'Otras telas personalizadas')
                            : 'Tela estándar de taller'}
                        </td>
                        <td className="text-center" style={{ fontWeight: 600 }}>{stats.ordersCount}</td>
                        <td className="text-right font-black" style={{ color: 'var(--brand-primary)', fontSize: '1.05rem' }}>
                          {stats.meters.toFixed(2)} m
                        </td>
                        <td className="text-right">
                          <div className="cost-input-wrapper">
                            <span className="currency-prefix">$</span>
                            <input 
                              type="text"
                              inputMode="numeric"
                              value={formatThousands(costsPerMeter[ft] || '')}
                              onChange={(e) => handleUpdateCost(ft, e.target.value)}
                              placeholder="0"
                              className="cost-input"
                              title={`Costo por metro para ${ft}`}
                            />
                          </div>
                        </td>
                        <td className="text-right font-black text-green" style={{ fontSize: '1.1rem' }}>
                          ${subtotal.toLocaleString('es-CO')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="totals-row">
                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Gran Total Consolidado:
                    </td>
                    <td className="text-right font-black text-primary" style={{ fontSize: '1.2rem' }}>
                      {totalMetersAll.toFixed(2)} m
                    </td>
                    <td style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                      (Costos aplicados)
                    </td>
                    <td className="text-right font-black text-green" style={{ fontSize: '1.3rem' }}>
                      ${totalCostToPay.toLocaleString('es-CO')} COP
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* DETALLE DE PEDIDOS INDIVIDUALES */}
          <div className="section-block" style={{ marginTop: '2rem' }}>
            <div className="block-header">
              <h3>📋 Detalle de Pedidos en este Período ({filteredOrders.length})</h3>
            </div>

            {loading ? (
              <p className="text-center" style={{ padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>Cargando registros...</p>
            ) : filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)' }}>
                No se encontraron pedidos con consumo de tela para los filtros seleccionados.
              </div>
            ) : (
              <div className="table-wrapper orders-detail-scroll">
                <table className="fabric-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Diseño (SKU)</th>
                      {isGlobal && <th>Cliente / Club</th>}
                      <th>Tipo de Tela</th>
                      <th>Prendas</th>
                      <th className="text-right">Metros (Corel)</th>
                      <th className="text-right">Costo Estimado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o => {
                      const { type, description } = parseOrderFabric(o.observations)
                      const costPerM = costsPerMeter[type] || 0
                      const orderMeters = o.fabric_meters || 0
                      const orderCost = orderMeters * costPerM

                      return (
                        <tr key={o.id}>
                          <td>{new Date(o.created_at).toLocaleDateString('es-CO')}</td>
                          <td><strong>{o.sku_reference || 'S/N'}</strong></td>
                          {isGlobal && (
                            <td>
                              <div><strong>{o.customers?.name || 'Cliente'}</strong></div>
                              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                                {o.customers?.school_or_club || o.customers?.city || ''}
                              </div>
                            </td>
                          )}
                          <td>
                            <span className={`fabric-badge badge-${type.toLowerCase().replace(/[^a-z]/g, '')}`}>
                              {type}
                            </span>
                            {description && (
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#facc15', marginTop: '0.2rem' }}>
                                {description}
                              </span>
                            )}
                          </td>
                          <td>{o.quantity} uds</td>
                          <td className="text-right font-black" style={{ color: 'var(--brand-primary)' }}>
                            {orderMeters > 0 ? `${orderMeters} m` : <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>0 m</span>}
                          </td>
                          <td className="text-right text-green font-bold">
                            ${orderCost.toLocaleString('es-CO')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.88); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 1050; padding: 1rem;
        }
        .modal-content.advanced-fabric-modal {
          background: #0d0d0d; border: 1px solid rgba(212, 255, 0, 0.2);
          width: 95%; max-width: 1050px; border-radius: 14px; max-height: 92vh;
          display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.9);
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.5rem 2rem; border-bottom: 1px solid rgba(255,255,255,0.08); background: #141414;
          border-radius: 14px 14px 0 0;
        }
        .modal-header h2 { margin: 0; color: white; font-size: 1.4rem; font-weight: 900; }
        .btn-close { background: none; border: none; color: white; font-size: 2.2rem; cursor: pointer; line-height: 1; opacity: 0.7; }
        .btn-close:hover { opacity: 1; }
        
        .modal-body { padding: 1.8rem 2rem; overflow-y: auto; flex: 1; }

        .filter-controls-box {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px; padding: 1rem 1.2rem; margin-bottom: 1.5rem;
        }
        .filter-row { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; }
        .filter-item { display: flex; flex-direction: column; gap: 0.3rem; min-width: 150px; }
        .filter-item label { font-size: 0.75rem; color: rgba(255,255,255,0.6); font-weight: 700; text-transform: uppercase; }
        .filter-item select, .filter-item input {
          background: #181818; color: white; border: 1px solid rgba(255,255,255,0.15);
          border-radius: 6px; padding: 0.5rem 0.8rem; font-size: 0.85rem; outline: none;
        }
        .filter-item select:focus, .filter-item input:focus { border-color: var(--brand-primary); }

        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.8rem; }
        .kpi-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 1.2rem; display: flex; flex-direction: column; gap: 0.3rem;
        }
        .kpi-card.highlight-meters {
          border-color: rgba(212, 255, 0, 0.3); background: rgba(212, 255, 0, 0.03);
        }
        .kpi-card.highlight-cost {
          border-color: rgba(34, 197, 94, 0.4); background: rgba(34, 197, 94, 0.05);
        }
        .kpi-label { font-size: 0.75rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; }
        .kpi-val { font-size: 1.8rem; font-weight: 900; color: white; }
        .kpi-sub { font-size: 0.8rem; color: rgba(255,255,255,0.5); }

        .section-block { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 1.4rem; }
        .block-header { margin-bottom: 1rem; }
        .block-header h3 { margin: 0; color: white; font-size: 1.1rem; }
        .block-header .hint { display: block; font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-top: 0.2rem; }

        .table-wrapper { overflow-x: auto; }
        .orders-detail-scroll { max-height: 280px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; }
        
        .fabric-table { width: 100%; border-collapse: collapse; }
        .fabric-table th {
          background: #181818; padding: 0.75rem 1rem; text-align: left; font-size: 0.8rem;
          color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(255,255,255,0.1); position: sticky; top: 0; z-index: 5;
        }
        .fabric-table td {
          padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);
          color: white; font-size: 0.9rem; vertical-align: middle;
        }
        .active-fabric-row { background: rgba(255,255,255,0.015); }
        .active-fabric-row:hover { background: rgba(255,255,255,0.035); }

        .cost-input-wrapper {
          display: inline-flex; align-items: center; background: #111;
          border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 0.3rem 0.6rem;
        }
        .cost-input-wrapper:focus-within { border-color: var(--brand-primary); }
        .currency-prefix { color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-right: 0.3rem; }
        .cost-input {
          background: transparent; border: none; color: white; font-weight: 700;
          font-size: 0.95rem; width: 90px; text-align: right; outline: none;
        }

        .fabric-badge {
          display: inline-block; padding: 0.25rem 0.7rem; border-radius: 4px;
          font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .badge-monteln { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
        .badge-cerro { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
        .badge-spernylon { background: rgba(249, 115, 22, 0.15); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.3); }
        .badge-otros { background: rgba(212, 255, 0, 0.15); color: var(--brand-primary); border: 1px solid rgba(212, 255, 0, 0.3); }

        .totals-row td {
          background: #141414; border-top: 2px solid rgba(255,255,255,0.15); border-bottom: none;
          padding: 1rem;
        }

        .text-primary { color: var(--brand-primary); }
        .text-green { color: #22c55e; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-black { font-weight: 900; }

        .btn-secondary {
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
          color: white; border-radius: 6px; font-weight: 700; cursor: pointer;
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  )
}
