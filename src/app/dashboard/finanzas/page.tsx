'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type Expense = {
  id: string
  category: string
  amount: number
  description: string
  created_at: string
}

export default function FinanzasDashboard() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // KPIs
  const [metrics, setMetrics] = useState({
    expectedIncome: 0,
    collectedIncome: 0,
    accountsReceivable: 0,
    totalExpenses: 0,
    netProfit: 0
  })

  const [expenses, setExpenses] = useState<Expense[]>([])
  
  // Modal de nuevo egreso
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [newExpense, setNewExpense] = useState({ category: 'Telas e Insumos', amount: '', description: '' })

  const CATEGORIES = ['Telas e Insumos', 'Nómina', 'Servicios Públicos', 'Publicidad', 'Mantenimiento', 'Otros']

  useEffect(() => {
    checkAccessAndLoad()
  }, [])

  const checkAccessAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    // TODO: Ajusta este correo por el tuyo real de administrador
    if (user?.email !== 'tucorreo@admin.com' && !user?.email?.includes('admin')) {
      // setIsAdmin(false)
      // router.push('/dashboard')
      // return
    }
    setIsAdmin(true)
    await loadFinancialData()
  }

  const loadFinancialData = async () => {
    setLoading(true)
    // 1. Cargar Ingresos (Ventas)
    const { data: orders } = await supabase.from('orders').select('total_price, advance_payment')
    let expected = 0
    let collected = 0

    if (orders) {
      orders.forEach(o => {
        expected += o.total_price || 0
        collected += o.advance_payment || 0
      })
    }

    // 2. Cargar Egresos (Gastos)
    const { data: expData, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false })
    let totalExp = 0
    if (expData && !error) {
      setExpenses(expData)
      expData.forEach(e => totalExp += e.amount)
    } else if (error) {
      console.error("No se pudo cargar expenses. ¿Ya creaste la tabla?", error)
    }

    setMetrics({
      expectedIncome: expected,
      collectedIncome: collected,
      accountsReceivable: expected - collected,
      totalExpenses: totalExp,
      netProfit: collected - totalExp
    })
    
    setLoading(false)
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('expenses').insert([{
      category: newExpense.category,
      amount: Number(newExpense.amount),
      description: newExpense.description,
      created_by: user?.id
    }])

    if (!error) {
      setShowExpenseModal(false)
      setNewExpense({ category: 'Telas e Insumos', amount: '', description: '' })
      loadFinancialData()
    } else {
      alert('Error registrando el gasto. Verifica que la tabla expenses exista.')
    }
  }

  if (!isAdmin) return null
  if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Cargando finanzas...</div>

  return (
    <div className="finanzas-container">
      <div className="finanzas-header">
        <div>
          <h1>Panel <span className="text-primary">Financiero</span></h1>
          <p>Visión general de ingresos, egresos y utilidad en tiempo real.</p>
        </div>
        <button onClick={() => setShowExpenseModal(true)} className="btn-expense">
          - Registrar Egreso
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card info">
          <h3>Ventas Totales Esperadas</h3>
          <div className="value">${metrics.expectedIncome.toLocaleString('es-CO')}</div>
          <p>Valor total de pedidos activos</p>
        </div>
        
        <div className="kpi-card success">
          <h3>Dinero Recaudado (Ingreso Real)</h3>
          <div className="value">${metrics.collectedIncome.toLocaleString('es-CO')}</div>
          <p>Sumatoria de todos los abonos</p>
        </div>
        
        <div className="kpi-card warning">
          <h3>Cuentas por Cobrar (Saldos)</h3>
          <div className="value">${metrics.accountsReceivable.toLocaleString('es-CO')}</div>
          <p>Dinero pendiente por recaudar</p>
        </div>

        <div className="kpi-card danger">
          <h3>Egresos Operativos</h3>
          <div className="value">-${metrics.totalExpenses.toLocaleString('es-CO')}</div>
          <p>Gastos totales registrados</p>
        </div>
      </div>

      <div className="profit-banner">
        <h2>Utilidad Neta (Recaudo - Egresos)</h2>
        <div className={`profit-value ${metrics.netProfit >= 0 ? 'text-green' : 'text-red'}`}>
          ${metrics.netProfit.toLocaleString('es-CO')}
        </div>
      </div>

      <div className="expenses-section">
        <h2>Últimos Egresos Registrados</h2>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th className="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 && (
                <tr><td colSpan={4} className="text-center">No hay egresos registrados.</td></tr>
              )}
              {expenses.map(exp => (
                <tr key={exp.id}>
                  <td>{new Date(exp.created_at).toLocaleDateString()}</td>
                  <td><span className="badge">{exp.category}</span></td>
                  <td>{exp.description}</td>
                  <td className="text-right text-red">-${exp.amount.toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Registrar Nuevo Egreso</h2>
              <button onClick={() => setShowExpenseModal(false)} className="btn-close">×</button>
            </div>
            <form onSubmit={handleAddExpense} className="expense-form">
              <div className="form-group">
                <label>Categoría</label>
                <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Valor ($)</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  value={newExpense.amount} 
                  onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                  placeholder="Ej: 50000"
                />
              </div>
              <div className="form-group">
                <label>Descripción / Concepto</label>
                <textarea 
                  required 
                  rows={3}
                  value={newExpense.description}
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                  placeholder="Ej: Pago de servicios, Compra de hilos..."
                />
              </div>
              <button type="submit" className="btn-submit">Guardar Egreso</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .finanzas-container { padding-bottom: 2rem; }
        .finanzas-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .finanzas-header h1 { font-size: 2rem; font-weight: 900; margin: 0; color: white; }
        .finanzas-header p { color: rgba(255,255,255,0.5); margin: 0.5rem 0 0 0; }
        .text-primary { color: var(--brand-primary); }
        
        .btn-expense { background: #ff4444; color: white; font-weight: 800; padding: 0.8rem 1.5rem; border-radius: 6px; border: none; cursor: pointer; text-transform: uppercase; }
        
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .kpi-card { background: #111; padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
        .kpi-card h3 { font-size: 0.9rem; color: rgba(255,255,255,0.6); text-transform: uppercase; margin: 0 0 0.5rem 0; }
        .kpi-card .value { font-size: 2rem; font-weight: 900; margin-bottom: 0.5rem; }
        .kpi-card p { font-size: 0.8rem; color: rgba(255,255,255,0.4); margin: 0; }
        
        .kpi-card.info .value { color: #3b82f6; }
        .kpi-card.success .value { color: #4ade80; }
        .kpi-card.warning .value { color: #facc15; }
        .kpi-card.danger .value { color: #ff5555; }
        
        .profit-banner { background: rgba(212,255,0,0.05); border: 1px solid rgba(212,255,0,0.2); padding: 2rem; border-radius: 12px; text-align: center; margin-bottom: 3rem; }
        .profit-banner h2 { color: rgba(255,255,255,0.8); text-transform: uppercase; font-size: 1rem; letter-spacing: 2px; margin: 0 0 1rem 0; }
        .profit-value { font-size: 3.5rem; font-weight: 900; }
        .text-green { color: #4ade80; }
        .text-red { color: #ff5555; }
        
        .expenses-section h2 { color: white; font-size: 1.5rem; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; }
        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; background: #111; border-radius: 8px; overflow: hidden; }
        .data-table th { background: #1a1a1a; padding: 1rem; text-align: left; font-size: 0.85rem; color: rgba(255,255,255,0.5); text-transform: uppercase; }
        .data-table td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: white; font-size: 0.95rem; }
        .data-table .badge { background: rgba(255,255,255,0.1); padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.8rem; }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        
        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: #0a0a0a; border: 1px solid rgba(255,255,255,0.1); width: 95%; max-width: 500px; border-radius: 12px; padding: 2rem; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .modal-header h2 { margin: 0; color: white; }
        .btn-close { background: none; border: none; color: white; font-size: 2rem; cursor: pointer; }
        .expense-form { display: flex; flex-direction: column; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { color: rgba(255,255,255,0.7); font-size: 0.85rem; text-transform: uppercase; }
        .form-group input, .form-group select, .form-group textarea { background: #111; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.8rem; border-radius: 4px; }
        .btn-submit { background: #ff4444; color: white; font-weight: 800; padding: 1rem; border: none; border-radius: 6px; cursor: pointer; text-transform: uppercase; margin-top: 1rem; }
      `}</style>
    </div>
  )
}
