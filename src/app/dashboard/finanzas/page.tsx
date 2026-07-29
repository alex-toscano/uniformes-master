'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type Supplier = { id: string; name: string; phone: string; service_type: string; created_at: string }
type Employee = { id: string; name: string; role: string; phone: string; created_at: string }
type Expense = {
  id: string; category: string; amount: number; description: string; created_at: string;
  supplier_id?: string; employee_id?: string;
  suppliers?: { name: string };
  employees?: { name: string };
}

export default function FinanzasDashboard() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'resumen' | 'proveedores' | 'nomina'>('resumen')

  // Data State
  const [metrics, setMetrics] = useState({ expectedIncome: 0, collectedIncome: 0, accountsReceivable: 0, totalExpenses: 0, netProfit: 0 })
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  
  // Modals State
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)

  // Forms State
  const CATEGORIES = ['Telas e Insumos', 'Pago a Proveedor', 'Pago de Nómina', 'Servicios Públicos', 'Publicidad', 'Mantenimiento', 'Otros']
  const [newExpense, setNewExpense] = useState({ category: 'Telas e Insumos', amount: '', description: '', supplier_id: '', employee_id: '' })
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', service_type: '' })
  const [newEmployee, setNewEmployee] = useState({ name: '', phone: '', role: '' })

  useEffect(() => {
    checkAccessAndLoad()
  }, [])

  const checkAccessAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setIsAdmin(true) // Forzado a true para MVP según instrucción anterior
    await Promise.all([loadFinancialData(), loadSuppliersAndEmployees()])
    setLoading(false)
  }

  const loadFinancialData = async () => {
    // 1. Cargar Ingresos
    const { data: orders } = await supabase.from('orders').select('total_price, advance_payment')
    let expected = 0; let collected = 0;
    if (orders) {
      orders.forEach(o => { expected += o.total_price || 0; collected += o.advance_payment || 0 })
    }

    // 2. Cargar Egresos con Relaciones
    const { data: expData, error } = await supabase
      .from('expenses')
      .select('*, suppliers(name), employees(name)')
      .order('created_at', { ascending: false })
    
    let totalExp = 0
    if (expData && !error) {
      setExpenses(expData as Expense[])
      expData.forEach(e => totalExp += e.amount)
    }

    setMetrics({
      expectedIncome: expected,
      collectedIncome: collected,
      accountsReceivable: expected - collected,
      totalExpenses: totalExp,
      netProfit: collected - totalExp
    })
  }

  const loadSuppliersAndEmployees = async () => {
    const { data: supData } = await supabase.from('suppliers').select('*').order('name')
    if (supData) setSuppliers(supData)

    const { data: empData } = await supabase.from('employees').select('*').order('name')
    if (empData) setEmployees(empData)
  }

  // --- Handlers para Guardar ---
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    
    const expenseData: any = {
      category: newExpense.category,
      amount: Number(newExpense.amount),
      description: newExpense.description,
      created_by: user?.id
    }
    
    if (newExpense.category === 'Pago a Proveedor' && newExpense.supplier_id) expenseData.supplier_id = newExpense.supplier_id
    if (newExpense.category === 'Pago de Nómina' && newExpense.employee_id) expenseData.employee_id = newExpense.employee_id

    const { error } = await supabase.from('expenses').insert([expenseData])
    if (!error) {
      setShowExpenseModal(false)
      setNewExpense({ category: 'Telas e Insumos', amount: '', description: '', supplier_id: '', employee_id: '' })
      loadFinancialData()
    } else {
      alert('Error registrando el gasto. Verifica la base de datos.')
    }
  }

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('suppliers').insert([newSupplier])
    if (!error) {
      setShowSupplierModal(false)
      setNewSupplier({ name: '', phone: '', service_type: '' })
      loadSuppliersAndEmployees()
    }
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('employees').insert([newEmployee])
    if (!error) {
      setShowEmployeeModal(false)
      setNewEmployee({ name: '', phone: '', role: '' })
      loadSuppliersAndEmployees()
    }
  }

  // Helper para sumar lo pagado a un proveedor o empleado
  const getTotalPaidTo = (type: 'supplier' | 'employee', id: string) => {
    return expenses
      .filter(e => type === 'supplier' ? e.supplier_id === id : e.employee_id === id)
      .reduce((acc, curr) => acc + curr.amount, 0)
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

      <div className="tabs">
        <button className={`tab ${activeTab === 'resumen' ? 'active' : ''}`} onClick={() => setActiveTab('resumen')}>📊 Resumen General</button>
        <button className={`tab ${activeTab === 'proveedores' ? 'active' : ''}`} onClick={() => setActiveTab('proveedores')}>🏭 Proveedores</button>
        <button className={`tab ${activeTab === 'nomina' ? 'active' : ''}`} onClick={() => setActiveTab('nomina')}>👥 Nómina</button>
      </div>

      {/* --- TAB: RESUMEN GENERAL --- */}
      {activeTab === 'resumen' && (
        <div className="tab-content">
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

          <div className="data-section">
            <h2>Últimos Egresos Registrados</h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Categoría</th>
                    <th>Beneficiario</th>
                    <th>Descripción</th>
                    <th className="text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 && <tr><td colSpan={5} className="text-center">No hay egresos registrados.</td></tr>}
                  {expenses.map(exp => (
                    <tr key={exp.id}>
                      <td>{new Date(exp.created_at).toLocaleDateString()}</td>
                      <td><span className="badge">{exp.category}</span></td>
                      <td>
                        {exp.suppliers?.name || exp.employees?.name || '-'}
                      </td>
                      <td>{exp.description}</td>
                      <td className="text-right text-red">-${exp.amount.toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: PROVEEDORES --- */}
      {activeTab === 'proveedores' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Directorio de Proveedores</h2>
            <button onClick={() => setShowSupplierModal(true)} className="btn-secondary">+ Nuevo Proveedor</button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Servicio / Insumo</th>
                  <th>Teléfono</th>
                  <th className="text-right">Total Pagado</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 && <tr><td colSpan={4} className="text-center">No hay proveedores registrados.</td></tr>}
                {suppliers.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.service_type}</td>
                    <td>{s.phone}</td>
                    <td className="text-right text-primary">${getTotalPaidTo('supplier', s.id).toLocaleString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB: NÓMINA --- */}
      {activeTab === 'nomina' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Equipo y Nómina</h2>
            <button onClick={() => setShowEmployeeModal(true)} className="btn-secondary">+ Nuevo Empleado / Satélite</button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cargo / Rol</th>
                  <th>Teléfono</th>
                  <th className="text-right">Total Pagado</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 && <tr><td colSpan={4} className="text-center">No hay empleados registrados.</td></tr>}
                {employees.map(e => (
                  <tr key={e.id}>
                    <td><strong>{e.name}</strong></td>
                    <td>{e.role}</td>
                    <td>{e.phone}</td>
                    <td className="text-right text-primary">${getTotalPaidTo('employee', e.id).toLocaleString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* --- MODAL: REGISTRAR EGRESO --- */}
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

              {/* Lógica Condicional para Beneficiario */}
              {newExpense.category === 'Pago a Proveedor' && (
                <div className="form-group">
                  <label>Seleccionar Proveedor</label>
                  <select required value={newExpense.supplier_id} onChange={e => setNewExpense({...newExpense, supplier_id: e.target.value})}>
                    <option value="">-- Seleccione Proveedor --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.service_type})</option>)}
                  </select>
                </div>
              )}
              {newExpense.category === 'Pago de Nómina' && (
                <div className="form-group">
                  <label>Seleccionar Empleado</label>
                  <select required value={newExpense.employee_id} onChange={e => setNewExpense({...newExpense, employee_id: e.target.value})}>
                    <option value="">-- Seleccione Empleado --</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>)}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Valor ($)</label>
                <input type="number" required min="0" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} placeholder="Ej: 50000" />
              </div>
              <div className="form-group">
                <label>Descripción / Concepto</label>
                <textarea required rows={2} value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="Ej: Pago de servicios, Compra de hilos..." />
              </div>
              <button type="submit" className="btn-submit">Guardar Egreso</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: NUEVO PROVEEDOR --- */}
      {showSupplierModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Nuevo Proveedor</h2>
              <button onClick={() => setShowSupplierModal(false)} className="btn-close">×</button>
            </div>
            <form onSubmit={handleAddSupplier} className="expense-form">
              <div className="form-group">
                <label>Nombre Empresa / Persona</label>
                <input type="text" required value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="text" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Tipo de Servicio / Insumo</label>
                <input type="text" required value={newSupplier.service_type} onChange={e => setNewSupplier({...newSupplier, service_type: e.target.value})} placeholder="Ej: Telas, Hilos, Estampado" />
              </div>
              <button type="submit" className="btn-submit">Crear Proveedor</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: NUEVO EMPLEADO --- */}
      {showEmployeeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Nuevo Empleado / Satélite</h2>
              <button onClick={() => setShowEmployeeModal(false)} className="btn-close">×</button>
            </div>
            <form onSubmit={handleAddEmployee} className="expense-form">
              <div className="form-group">
                <label>Nombre Completo</label>
                <input type="text" required value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="text" value={newEmployee.phone} onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Cargo / Rol</label>
                <input type="text" required value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value})} placeholder="Ej: Confeccionista, Cortador, Diseñadora" />
              </div>
              <button type="submit" className="btn-submit">Crear Empleado</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .finanzas-container { padding-bottom: 2rem; }
        .finanzas-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .finanzas-header h1 { font-size: 2rem; font-weight: 900; margin: 0; color: white; }
        .finanzas-header p { color: rgba(255,255,255,0.5); margin: 0.5rem 0 0 0; }
        .text-primary { color: var(--brand-primary); }
        
        .tabs { display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; }
        .tab { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); padding: 0.8rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: 700; transition: all 0.2s; }
        .tab.active { background: rgba(212,255,0,0.1); color: var(--brand-primary); border-color: var(--brand-primary); }
        .tab:hover:not(.active) { background: rgba(255,255,255,0.05); color: white; }
        
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .section-header h2 { color: white; margin: 0; }
        
        .btn-expense { background: #ff4444; color: white; font-weight: 800; padding: 0.8rem 1.5rem; border-radius: 6px; border: none; cursor: pointer; text-transform: uppercase; }
        .btn-secondary { background: rgba(255,255,255,0.1); color: white; font-weight: 700; padding: 0.6rem 1.2rem; border-radius: 6px; border: none; cursor: pointer; transition: background 0.2s; }
        .btn-secondary:hover { background: rgba(255,255,255,0.2); }
        
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
        
        .data-section h2 { color: white; font-size: 1.5rem; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; }
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
        .modal-header h2 { margin: 0; color: white; font-size: 1.2rem; }
        .btn-close { background: none; border: none; color: white; font-size: 2rem; cursor: pointer; }
        .expense-form { display: flex; flex-direction: column; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { color: rgba(255,255,255,0.7); font-size: 0.85rem; text-transform: uppercase; }
        .form-group input, .form-group select, .form-group textarea { background: #111; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.8rem; border-radius: 4px; }
        .btn-submit { background: var(--brand-primary); color: black; font-weight: 800; padding: 1rem; border: none; border-radius: 6px; cursor: pointer; text-transform: uppercase; margin-top: 1rem; transition: transform 0.2s; }
        .btn-submit:hover { transform: translateY(-2px); }
      `}</style>
    </div>
  )
}
