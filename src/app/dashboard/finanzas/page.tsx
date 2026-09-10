'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type Supplier = { id: string; name: string; phone: string; service_type: string; created_at: string }
type Employee = { id: string; name: string; role: string; phone: string; created_at: string }
type Expense = {
  id: string; category: string; amount: number; description: string; created_at: string;
  supplier_id?: string; employee_id?: string;
  suppliers?: { name: string };
  employees?: { name: string };
}
type OrderFinancial = {
  id: string
  sku_reference: string
  total_price: number
  advance_payment: number
  status: string
  created_at: string
  delivery_date?: string | null
  customers?: {
    name: string
    school_or_club: string
    city?: string
  }
}

export default function FinanzasDashboard() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'resumen' | 'cartera' | 'egresos' | 'proveedores' | 'nomina'>('resumen')
  const [dateFilter, setDateFilter] = useState<'month' | 'last30' | 'all'>('all')

  // Data State
  const [orders, setOrders] = useState<OrderFinancial[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  
  // Modals State
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)

  // Quick payment modal for orders
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<OrderFinancial | null>(null)
  const [newPaymentAmount, setNewPaymentAmount] = useState('')
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false)

  // Search in Cartera
  const [carteraSearch, setCarteraSearch] = useState('')
  const [carteraRiskFilter, setCarteraRiskFilter] = useState<'all' | 'delivered_unpaid' | 'active'>('all')

  // Forms State
  const CATEGORIES = [
    'Telas e Insumos',
    'Pago a Proveedor',
    'Pago de Nómina',
    'Servicios Públicos',
    'Publicidad y Marketing',
    'Mantenimiento y Maquinaria',
    'Logística y Envíos',
    'Otros Gastos Operativos'
  ]
  const [newExpense, setNewExpense] = useState({ category: 'Telas e Insumos', amount: '', description: '', supplier_id: '', employee_id: '' })
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', service_type: '' })
  const [newEmployee, setNewEmployee] = useState({ name: '', phone: '', role: '' })

  useEffect(() => {
    checkAccessAndLoad()
  }, [])

  const checkAccessAndLoad = async () => {
    setIsAdmin(true)
    await Promise.all([loadFinancialData(), loadSuppliersAndEmployees()])
    setLoading(false)
  }

  const loadFinancialData = async () => {
    // 1. Cargar Pedidos con Clientes
    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, sku_reference, total_price, advance_payment, status, created_at, delivery_date, customers(name, school_or_club, city)')
      .order('created_at', { ascending: false })

    if (ordersData) {
      setOrders(ordersData as any[])
    }

    // 2. Cargar Egresos con Relaciones
    const { data: expData, error } = await supabase
      .from('expenses')
      .select('*, suppliers(name), employees(name)')
      .order('created_at', { ascending: false })
    
    if (expData && !error) {
      setExpenses(expData as Expense[])
    }
  }

  const loadSuppliersAndEmployees = async () => {
    const { data: supData } = await supabase.from('suppliers').select('*').order('name')
    if (supData) setSuppliers(supData)

    const { data: empData } = await supabase.from('employees').select('*').order('name')
    if (empData) setEmployees(empData)
  }

  // Filtrado de pedidos según período seleccionado
  const filteredOrders = useMemo(() => {
    const now = new Date()
    return orders.filter(o => {
      if (dateFilter === 'all') return true
      const orderDate = new Date(o.created_at)
      if (dateFilter === 'month') {
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
      }
      if (dateFilter === 'last30') {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24)
        return diffDays <= 30
      }
      return true
    })
  }, [orders, dateFilter])

  // Filtrado de gastos según período seleccionado
  const filteredExpenses = useMemo(() => {
    const now = new Date()
    return expenses.filter(e => {
      if (dateFilter === 'all') return true
      const expDate = new Date(e.created_at)
      if (dateFilter === 'month') {
        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()
      }
      if (dateFilter === 'last30') {
        const diffDays = (now.getTime() - expDate.getTime()) / (1000 * 3600 * 24)
        return diffDays <= 30
      }
      return true
    })
  }, [expenses, dateFilter])

  // Métricas Calculadas
  const metrics = useMemo(() => {
    let totalFacturado = 0
    let totalRecaudado = 0
    let totalCartera = 0
    let carteraEnRiesgo = 0
    let pedidosPendientesPagoCount = 0

    filteredOrders.forEach(o => {
      const total = o.total_price || 0
      const abonado = o.advance_payment || 0
      const pendiente = Math.max(0, total - abonado)

      totalFacturado += total
      totalRecaudado += abonado
      totalCartera += pendiente

      if (pendiente > 0) {
        pedidosPendientesPagoCount++
        if (o.status === 'entregado') {
          carteraEnRiesgo += pendiente
        }
      }
    })

    const totalGastos = filteredExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0)
    const utilidadNeta = totalRecaudado - totalGastos
    const margenNeto = totalRecaudado > 0 ? ((utilidadNeta / totalRecaudado) * 100).toFixed(1) : '0.0'
    const tasaRecaudo = totalFacturado > 0 ? ((totalRecaudado / totalFacturado) * 100).toFixed(1) : '0.0'

    // Desglose de egresos por categoría
    const gastosPorCategoria: Record<string, number> = {}
    filteredExpenses.forEach(e => {
      gastosPorCategoria[e.category] = (gastosPorCategoria[e.category] || 0) + e.amount
    })

    return {
      totalFacturado,
      totalRecaudado,
      totalCartera,
      carteraEnRiesgo,
      totalGastos,
      utilidadNeta,
      margenNeto,
      tasaRecaudo,
      pedidosPendientesPagoCount,
      gastosPorCategoria
    }
  }, [filteredOrders, filteredExpenses])

  // Lista de deudores / Cuentas por cobrar
  const cuentasPorCobrar = useMemo(() => {
    return filteredOrders
      .filter(o => (o.total_price || 0) > (o.advance_payment || 0))
      .filter(o => {
        if (carteraRiskFilter === 'delivered_unpaid') return o.status === 'entregado'
        if (carteraRiskFilter === 'active') return o.status !== 'entregado'
        return true
      })
      .filter(o => {
        if (!carteraSearch.trim()) return true
        const q = carteraSearch.toLowerCase()
        const cliente = o.customers?.name?.toLowerCase() || ''
        const club = o.customers?.school_or_club?.toLowerCase() || ''
        const ref = o.sku_reference.toLowerCase()
        return cliente.includes(q) || club.includes(q) || ref.includes(q)
      })
      .sort((a, b) => {
        const balanceA = (a.total_price || 0) - (a.advance_payment || 0)
        const balanceB = (b.total_price || 0) - (b.advance_payment || 0)
        if (a.status === 'entregado' && b.status !== 'entregado') return -1
        if (b.status === 'entregado' && a.status !== 'entregado') return 1
        return balanceB - balanceA
      })
  }, [filteredOrders, carteraSearch, carteraRiskFilter])

  // Registro de nuevo abono o pago total para un pedido
  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrderForPayment) return

    const amountToAdd = Number(newPaymentAmount)
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      alert('Por favor ingresa un monto válido a abonar.')
      return
    }

    const currentAdvance = selectedOrderForPayment.advance_payment || 0
    const newTotalAdvance = currentAdvance + amountToAdd

    if (newTotalAdvance > selectedOrderForPayment.total_price) {
      if (!confirm(`El abono total ($${newTotalAdvance.toLocaleString('es-CO')}) supera el valor del pedido ($${selectedOrderForPayment.total_price.toLocaleString('es-CO')}). ¿Deseas continuar?`)) {
        return
      }
    }

    setIsUpdatingPayment(true)
    const { error } = await supabase
      .from('orders')
      .update({ advance_payment: newTotalAdvance })
      .eq('id', selectedOrderForPayment.id)

    setIsUpdatingPayment(false)

    if (!error) {
      setShowPaymentModal(false)
      setSelectedOrderForPayment(null)
      setNewPaymentAmount('')
      loadFinancialData()
    } else {
      alert('Error actualizando el abono del pedido.')
    }
  }

  // Exportar Informe Ejecutivo en PDF
  const handleExportPDF = () => {
    const doc = new jsPDF()

    // Header con estilo ejecutivo
    doc.setFillColor(15, 15, 15)
    doc.rect(0, 0, 210, 42, 'F')

    doc.setFontSize(22)
    doc.setTextColor(212, 255, 0)
    doc.text('ERP MASTER', 14, 18)

    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text('INFORME FINANCIERO EJECUTIVO Y ESTADO DE CAJA', 14, 26)

    doc.setFontSize(8)
    doc.setTextColor(180, 180, 180)
    const periodoLabel = dateFilter === 'month' ? 'Mes Actual' : dateFilter === 'last30' ? 'Últimos 30 Días' : 'Histórico Total'
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')} | Período: ${periodoLabel}`, 14, 34)

    // Resumen Ejecutivo en 2 Columnas
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text('1. RESUMEN DE SALUD FINANCIERA', 14, 52)

    autoTable(doc, {
      startY: 56,
      head: [['Métrica Financiera', 'Valor Registrado', 'Interpretación']],
      body: [
        ['Facturación Total (Ventas)', `$${metrics.totalFacturado.toLocaleString('es-CO')}`, 'Volumen total comercializado'],
        ['Recaudo Real en Caja (Abonos)', `$${metrics.totalRecaudado.toLocaleString('es-CO')}`, `Efectividad de cobranza: ${metrics.tasaRecaudo}%`],
        ['Cuentas por Cobrar (Cartera)', `$${metrics.totalCartera.toLocaleString('es-CO')}`, `${metrics.pedidosPendientesPagoCount} pedidos con saldo pendiente`],
        ['Cartera Crítica en Riesgo', `$${metrics.carteraEnRiesgo.toLocaleString('es-CO')}`, 'Prendas entregadas pendientes de cobro'],
        ['Egresos Operativos Totales', `-$${metrics.totalGastos.toLocaleString('es-CO')}`, 'Gastos operacionales y compras'],
        ['UTILIDAD NETA DISPONIBLE', `$${metrics.utilidadNeta.toLocaleString('es-CO')}`, `Margen operativo neto: ${metrics.margenNeto}%`]
      ],
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9 }
    })

    // Desglose de Gastos
    let currentY = (doc as any).lastAutoTable.finalY + 12
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text('2. DISTRIBUCIÓN DE EGRESOS POR CATEGORÍA', 14, currentY)

    const gastosRows = Object.entries(metrics.gastosPorCategoria).map(([cat, val]) => {
      const pct = metrics.totalGastos > 0 ? ((val / metrics.totalGastos) * 100).toFixed(1) : '0'
      return [cat, `$${val.toLocaleString('es-CO')}`, `${pct}%`]
    })

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Categoría de Egreso', 'Monto Gastado', '% del Total']],
      body: gastosRows.length > 0 ? gastosRows : [['Sin egresos en el período', '$0', '0%']],
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9 }
    })

    // Cuentas por Cobrar Pendientes (Top 10)
    currentY = (doc as any).lastAutoTable.finalY + 12
    if (currentY > 230) {
      doc.addPage()
      currentY = 20
    }

    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text('3. PRINCIPALES CUENTAS POR COBRAR (TOP DEUDORES)', 14, currentY)

    const topDebtors = cuentasPorCobrar.slice(0, 10).map(o => {
      const saldo = (o.total_price || 0) - (o.advance_payment || 0)
      return [
        o.sku_reference,
        o.customers?.name || 'Cliente sin nombre',
        o.customers?.school_or_club || '-',
        o.status === 'entregado' ? 'ENTREGADO (ALTO RIESGO)' : o.status.toUpperCase(),
        `$${saldo.toLocaleString('es-CO')}`
      ]
    })

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Ref / Pedido', 'Cliente', 'Institución / Club', 'Estado Pedido', 'Saldo Pendiente']],
      body: topDebtors.length > 0 ? topDebtors : [['No hay saldos pendientes', '-', '-', '-', '$0']],
      headStyles: { fillColor: [202, 138, 4], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8 }
    })

    doc.save(`Informe_Financiero_ERP_${new Date().toISOString().split('T')[0]}.pdf`)
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
  if (loading) return (
    <div style={{ color: 'white', padding: '4rem 2rem', textAlign: 'center' }}>
      <div className="spinner" />
      <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.6)' }}>Cargando inteligencia financiera gerencial...</p>
    </div>
  )

  return (
    <div className="finanzas-container">
      {/* HEADER PRINCIPAL */}
      <div className="finanzas-header">
        <div>
          <div className="header-badge">
            💼 CENTRO DE INTELIGENCIA FINANCIERA
          </div>
          <h1>Tablero <span className="text-primary">Económico y Financiero</span></h1>
          <p>Visión periférica de caja, rentabilidad real, flujo de cartera y egresos en tiempo real.</p>
        </div>
        
        <div className="header-actions">
          {/* Selector de Período */}
          <div className="date-filter-wrap">
            <button 
              className={`btn-date-filter ${dateFilter === 'month' ? 'active' : ''}`}
              onClick={() => setDateFilter('month')}
            >
              Este Mes
            </button>
            <button 
              className={`btn-date-filter ${dateFilter === 'last30' ? 'active' : ''}`}
              onClick={() => setDateFilter('last30')}
            >
              Últimos 30d
            </button>
            <button 
              className={`btn-date-filter ${dateFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDateFilter('all')}
            >
              Histórico
            </button>
          </div>

          <button onClick={handleExportPDF} className="btn-export-pdf" title="Descargar Balance Ejecutivo en PDF">
            📄 Informe PDF
          </button>
          <button onClick={() => setShowExpenseModal(true)} className="btn-expense">
            - Registrar Egreso
          </button>
        </div>
      </div>

      {/* SEMÁFORO DE SALUD FINANCIERA (BARRA PRINCIPAL) */}
      <div className="health-bar-card">
        <div className="health-item">
          <span className="health-label">LIQUIDEZ NETA (CAJA REAL)</span>
          <div className={`health-value ${metrics.utilidadNeta >= 0 ? 'text-green' : 'text-red'}`}>
            ${metrics.utilidadNeta.toLocaleString('es-CO')}
          </div>
          <span className="health-sub">Abonos recaudados menos egresos</span>
        </div>

        <div className="health-divider" />

        <div className="health-item">
          <span className="health-label">MARGEN OPERATIVO REAL</span>
          <div className="health-value text-primary">
            {metrics.margenNeto}%
          </div>
          <span className="health-sub">Ganancia neta sobre dinero cobrado</span>
        </div>

        <div className="health-divider" />

        <div className="health-item">
          <span className="health-label">EFECTIVIDAD DE RECAUDO</span>
          <div className="health-value text-blue">
            {metrics.tasaRecaudo}%
          </div>
          <span className="health-sub">Cobrado del total vendido</span>
        </div>

        <div className="health-divider" />

        <div className="health-item">
          <span className="health-label">CARTERA EN RIESGO</span>
          <div className={`health-value ${metrics.carteraEnRiesgo > 0 ? 'text-danger-pulse' : 'text-green'}`}>
            ${metrics.carteraEnRiesgo.toLocaleString('es-CO')}
          </div>
          <span className="health-sub">Pedidos entregados sin liquidar</span>
        </div>
      </div>

      {/* GRID DE KPIs PRIMARIOS */}
      <div className="kpi-grid">
        <div className="kpi-card info">
          <div className="kpi-header">
            <h3>Facturación Total</h3>
            <span className="kpi-icon">📈</span>
          </div>
          <div className="value">${metrics.totalFacturado.toLocaleString('es-CO')}</div>
          <p>Valor total de órdenes registradas en el período</p>
        </div>

        <div className="kpi-card success">
          <div className="kpi-header">
            <h3>Dinero Recaudado (Ingreso Real)</h3>
            <span className="kpi-icon">💵</span>
          </div>
          <div className="value">${metrics.totalRecaudado.toLocaleString('es-CO')}</div>
          <p>Efectivo y transferencias en cuentas bancarias</p>
        </div>

        <div className="kpi-card warning">
          <div className="kpi-header">
            <h3>Cuentas por Cobrar (Cartera)</h3>
            <span className="kpi-icon">⏳</span>
          </div>
          <div className="value">${metrics.totalCartera.toLocaleString('es-CO')}</div>
          <p>{metrics.pedidosPendientesPagoCount} pedidos con saldo pendiente por cobrar</p>
        </div>

        <div className="kpi-card danger">
          <div className="kpi-header">
            <h3>Egresos Operativos</h3>
            <span className="kpi-icon">📉</span>
          </div>
          <div className="value">-${metrics.totalGastos.toLocaleString('es-CO')}</div>
          <p>Gastos pagados (compras, insumos, nómina)</p>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'resumen' ? 'active' : ''}`} 
          onClick={() => setActiveTab('resumen')}
        >
          📊 Resumen y Análisis
        </button>
        <button 
          className={`tab ${activeTab === 'cartera' ? 'active' : ''}`} 
          onClick={() => setActiveTab('cartera')}
        >
          💰 Cuentas por Cobrar ({metrics.pedidosPendientesPagoCount})
        </button>
        <button 
          className={`tab ${activeTab === 'egresos' ? 'active' : ''}`} 
          onClick={() => setActiveTab('egresos')}
        >
          📉 Desglose de Gastos ({filteredExpenses.length})
        </button>
        <button 
          className={`tab ${activeTab === 'proveedores' ? 'active' : ''}`} 
          onClick={() => setActiveTab('proveedores')}
        >
          🏭 Proveedores ({suppliers.length})
        </button>
        <button 
          className={`tab ${activeTab === 'nomina' ? 'active' : ''}`} 
          onClick={() => setActiveTab('nomina')}
        >
          👥 Nómina Satélite ({employees.length})
        </button>
      </div>

      {/* ===================== TAB: RESUMEN GENERAL ===================== */}
      {activeTab === 'resumen' && (
        <div className="tab-content">
          <div className="dashboard-columns">
            {/* Columna Izquierda: Radiografía de Gastos */}
            <div className="analysis-box">
              <div className="analysis-header">
                <h3>Distribución de Gastos Operativos</h3>
                <span className="sub-tag">{Object.keys(metrics.gastosPorCategoria).length} categorías</span>
              </div>
              <div className="category-bars">
                {Object.keys(metrics.gastosPorCategoria).length === 0 ? (
                  <p className="empty-text">No hay gastos registrados en este período.</p>
                ) : (
                  Object.entries(metrics.gastosPorCategoria)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, amount]) => {
                      const pct = metrics.totalGastos > 0 ? (amount / metrics.totalGastos) * 100 : 0
                      return (
                        <div key={cat} className="bar-row">
                          <div className="bar-info">
                            <span className="bar-label">{cat}</span>
                            <span className="bar-val">${amount.toLocaleString('es-CO')} ({pct.toFixed(1)}%)</span>
                          </div>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })
                )}
              </div>
            </div>

            {/* Columna Derecha: Alertas de Cartera y Cobranza */}
            <div className="analysis-box">
              <div className="analysis-header">
                <h3>Top Saldos Pendientes (Urgencia de Cobro)</h3>
                <button 
                  onClick={() => setActiveTab('cartera')}
                  className="btn-link-tab"
                >
                  Ver Cartera Completa →
                </button>
              </div>

              <div className="debt-list">
                {cuentasPorCobrar.length === 0 ? (
                  <p className="empty-text">🎉 ¡Excelente! No tienes deudas pendientes en este período.</p>
                ) : (
                  cuentasPorCobrar.slice(0, 5).map(o => {
                    const balance = (o.total_price || 0) - (o.advance_payment || 0)
                    const isDelivered = o.status === 'entregado'
                    return (
                      <div key={o.id} className={`debt-item ${isDelivered ? 'item-risk' : ''}`}>
                        <div>
                          <div className="debt-title">
                            <strong>{o.sku_reference}</strong> • {o.customers?.name || 'Cliente'}
                            {isDelivered && <span className="risk-tag">⚠️ ENTREGADO SIN SALDAR</span>}
                          </div>
                          <div className="debt-sub">
                            Total: ${o.total_price.toLocaleString('es-CO')} | Pagado: ${o.advance_payment.toLocaleString('es-CO')}
                          </div>
                        </div>
                        <div className="debt-action-wrap">
                          <div className="debt-balance">
                            ${balance.toLocaleString('es-CO')}
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedOrderForPayment(o)
                              setNewPaymentAmount('')
                              setShowPaymentModal(true)
                            }}
                            className="btn-quick-pay"
                            title="Registrar Abono"
                          >
                            + Cobrar
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Tabla de Últimos Egresos */}
          <div className="data-section" style={{ marginTop: '2.5rem' }}>
            <div className="section-header">
              <h2>Últimos Egresos Registrados</h2>
              <button onClick={() => setShowExpenseModal(true)} className="btn-secondary">+ Registrar Egreso</button>
            </div>
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
                  {filteredExpenses.length === 0 && (
                    <tr><td colSpan={5} className="text-center">No hay egresos en el período seleccionado.</td></tr>
                  )}
                  {filteredExpenses.slice(0, 8).map(exp => (
                    <tr key={exp.id}>
                      <td>{new Date(exp.created_at).toLocaleDateString('es-CO')}</td>
                      <td><span className="badge">{exp.category}</span></td>
                      <td>{exp.suppliers?.name || exp.employees?.name || '-'}</td>
                      <td>{exp.description}</td>
                      <td className="text-right text-red font-bold">-${exp.amount.toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: CARTERA (CUENTAS POR COBRAR) ===================== */}
      {activeTab === 'cartera' && (
        <div className="tab-content">
          <div className="section-header">
            <div>
              <h2>Gestión de Cartera y Cobranzas</h2>
              <p className="section-desc">Identifica pedidos con saldo adeudado, gestiona clientes morosos y registra nuevos recaudos.</p>
            </div>
          </div>

          {/* Filtros de Cartera */}
          <div className="cartera-filters-bar">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Buscar por cliente, colegio/club o SKU..."
                value={carteraSearch}
                onChange={e => setCarteraSearch(e.target.value)}
              />
            </div>

            <div className="risk-filter-buttons">
              <button 
                className={`filter-chip ${carteraRiskFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCarteraRiskFilter('all')}
              >
                Todos con Saldo ({cuentasPorCobrar.length})
              </button>
              <button 
                className={`filter-chip chip-risk ${carteraRiskFilter === 'delivered_unpaid' ? 'active' : ''}`}
                onClick={() => setCarteraRiskFilter('delivered_unpaid')}
              >
                ⚠️ Entregados sin Liquidar
              </button>
              <button 
                className={`filter-chip ${carteraRiskFilter === 'active' ? 'active' : ''}`}
                onClick={() => setCarteraRiskFilter('active')}
              >
                📦 En Producción / Activos
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Referencia / Pedido</th>
                  <th>Cliente e Institución</th>
                  <th>Estado del Pedido</th>
                  <th className="text-right">Valor Total</th>
                  <th className="text-right">Abonado</th>
                  <th className="text-right">Saldo Pendiente</th>
                  <th className="text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {cuentasPorCobrar.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center" style={{ padding: '3rem' }}>
                      No se encontraron pedidos con saldos pendientes según los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  cuentasPorCobrar.map(o => {
                    const balance = (o.total_price || 0) - (o.advance_payment || 0)
                    const isDelivered = o.status === 'entregado'
                    const pctPaid = o.total_price > 0 ? Math.round((o.advance_payment / o.total_price) * 100) : 0

                    return (
                      <tr key={o.id} className={isDelivered ? 'row-risk' : ''}>
                        <td>
                          <strong>{o.sku_reference}</strong>
                          <div className="cell-sub">{new Date(o.created_at).toLocaleDateString('es-CO')}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{o.customers?.name || 'Cliente sin nombre'}</div>
                          <div className="cell-sub">{o.customers?.school_or_club || o.customers?.city || '-'}</div>
                        </td>
                        <td>
                          {isDelivered ? (
                            <span className="badge badge-risk">⚠️ ENTREGADO (POR COBRAR)</span>
                          ) : (
                            <span className="badge badge-active">{o.status.toUpperCase()}</span>
                          )}
                        </td>
                        <td className="text-right font-bold">${o.total_price.toLocaleString('es-CO')}</td>
                        <td className="text-right text-green">${o.advance_payment.toLocaleString('es-CO')} ({pctPaid}%)</td>
                        <td className="text-right text-yellow font-black" style={{ fontSize: '1.05rem' }}>
                          ${balance.toLocaleString('es-CO')}
                        </td>
                        <td className="text-center">
                          <button 
                            onClick={() => {
                              setSelectedOrderForPayment(o)
                              setNewPaymentAmount('')
                              setShowPaymentModal(true)
                            }}
                            className="btn-pay-action"
                          >
                            💵 Registrar Cobro
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== TAB: DESGLOSE DE GASTOS ===================== */}
      {activeTab === 'egresos' && (
        <div className="tab-content">
          <div className="section-header">
            <div>
              <h2>Libro de Egresos y Gastos Operacionales</h2>
              <p className="section-desc">Auditoría detallada de cada egreso registrado en la empresa.</p>
            </div>
            <button onClick={() => setShowExpenseModal(true)} className="btn-expense">+ Registrar Egreso</button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Beneficiario (Proveedor/Nómina)</th>
                  <th>Concepto / Detalle</th>
                  <th className="text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 && (
                  <tr><td colSpan={5} className="text-center">No hay egresos registrados en este período.</td></tr>
                )}
                {filteredExpenses.map(exp => (
                  <tr key={exp.id}>
                    <td>{new Date(exp.created_at).toLocaleDateString('es-CO')}</td>
                    <td><span className="badge">{exp.category}</span></td>
                    <td>{exp.suppliers?.name || exp.employees?.name || 'Gasto General'}</td>
                    <td>{exp.description}</td>
                    <td className="text-right text-red font-black" style={{ fontSize: '1.05rem' }}>
                      -${exp.amount.toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== TAB: PROVEEDORES ===================== */}
      {activeTab === 'proveedores' && (
        <div className="tab-content">
          <div className="section-header">
            <div>
              <h2>Directorio y Estado de Pagos a Proveedores</h2>
              <p className="section-desc">Control acumulado de compras realizadas a distribuidores de insumos y telas.</p>
            </div>
            <button onClick={() => setShowSupplierModal(true)} className="btn-secondary">+ Nuevo Proveedor</button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre Comercial</th>
                  <th>Servicio / Insumo</th>
                  <th>Teléfono de Contacto</th>
                  <th className="text-right">Total Acumulado Pagado</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 && <tr><td colSpan={4} className="text-center">No hay proveedores registrados.</td></tr>}
                {suppliers.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.service_type}</td>
                    <td>{s.phone || '-'}</td>
                    <td className="text-right text-primary font-black" style={{ fontSize: '1.05rem' }}>
                      ${getTotalPaidTo('supplier', s.id).toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== TAB: NÓMINA ===================== */}
      {activeTab === 'nomina' && (
        <div className="tab-content">
          <div className="section-header">
            <div>
              <h2>Equipo Operativo y Nómina Satélite</h2>
              <p className="section-desc">Pagos acumulados a operarios de confección, corte, diseño y personal de planta.</p>
            </div>
            <button onClick={() => setShowEmployeeModal(true)} className="btn-secondary">+ Nuevo Empleado / Satélite</button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre del Colaborador</th>
                  <th>Especialidad / Cargo</th>
                  <th>Teléfono</th>
                  <th className="text-right">Total Pagado Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 && <tr><td colSpan={4} className="text-center">No hay colaboradores registrados.</td></tr>}
                {employees.map(e => (
                  <tr key={e.id}>
                    <td><strong>{e.name}</strong></td>
                    <td>{e.role}</td>
                    <td>{e.phone || '-'}</td>
                    <td className="text-right text-primary font-black" style={{ fontSize: '1.05rem' }}>
                      ${getTotalPaidTo('employee', e.id).toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== MODAL: REGISTRAR ABONO A PEDIDO ===================== */}
      {showPaymentModal && selectedOrderForPayment && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💰 Registrar Recaudo / Abono</h2>
              <button onClick={() => setShowPaymentModal(false)} className="btn-close">×</button>
            </div>
            <div className="order-payment-info">
              <div><strong>Pedido:</strong> {selectedOrderForPayment.sku_reference}</div>
              <div><strong>Cliente:</strong> {selectedOrderForPayment.customers?.name || 'Cliente'}</div>
              <div><strong>Valor Total:</strong> ${selectedOrderForPayment.total_price.toLocaleString('es-CO')}</div>
              <div><strong>Abono Actual:</strong> ${selectedOrderForPayment.advance_payment.toLocaleString('es-CO')}</div>
              <div className="balance-highlight">
                <strong>Saldo Pendiente:</strong> ${((selectedOrderForPayment.total_price || 0) - (selectedOrderForPayment.advance_payment || 0)).toLocaleString('es-CO')}
              </div>
            </div>

            <form onSubmit={handleRegisterPayment} className="expense-form" style={{ marginTop: '1.2rem' }}>
              <div className="form-group">
                <label>Monto a Abonar en este momento ($ COP)</label>
                <input 
                  type="number" 
                  required 
                  min="1" 
                  autoFocus
                  value={newPaymentAmount} 
                  onChange={e => setNewPaymentAmount(e.target.value)} 
                  placeholder="Ej: 50000" 
                />
              </div>

              {/* Botón de saldo completo */}
              <button 
                type="button"
                className="btn-pay-full"
                onClick={() => {
                  const saldo = (selectedOrderForPayment.total_price || 0) - (selectedOrderForPayment.advance_payment || 0)
                  setNewPaymentAmount(saldo > 0 ? saldo.toString() : '0')
                }}
              >
                ⚡ Liquidar Todo el Saldo Pendiente
              </button>

              <button type="submit" className="btn-submit" disabled={isUpdatingPayment}>
                {isUpdatingPayment ? 'Guardando...' : 'Confirmar Recaudo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: REGISTRAR EGRESO ===================== */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Nuevo Egreso Operativo</h2>
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
                  <label>Seleccionar Colaborador / Satélite</label>
                  <select required value={newExpense.employee_id} onChange={e => setNewExpense({...newExpense, employee_id: e.target.value})}>
                    <option value="">-- Seleccione Empleado --</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>)}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Valor a Egresar ($ COP)</label>
                <input type="number" required min="1" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} placeholder="Ej: 50000" />
              </div>
              <div className="form-group">
                <label>Descripción / Concepto del Gasto</label>
                <textarea required rows={2} value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="Ej: Compra de 20m de antifluido, Pago confección camisa..." />
              </div>
              <button type="submit" className="btn-submit">Guardar Egreso</button>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: NUEVO PROVEEDOR ===================== */}
      {showSupplierModal && (
        <div className="modal-overlay" onClick={() => setShowSupplierModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Proveedor</h2>
              <button onClick={() => setShowSupplierModal(false)} className="btn-close">×</button>
            </div>
            <form onSubmit={handleAddSupplier} className="expense-form">
              <div className="form-group">
                <label>Nombre Empresa / Proveedor</label>
                <input type="text" required value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="text" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Tipo de Servicio / Insumo</label>
                <input type="text" required value={newSupplier.service_type} onChange={e => setNewSupplier({...newSupplier, service_type: e.target.value})} placeholder="Ej: Telas, Hilos, Cremalleras, Sublimación" />
              </div>
              <button type="submit" className="btn-submit">Crear Proveedor</button>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: NUEVO EMPLEADO ===================== */}
      {showEmployeeModal && (
        <div className="modal-overlay" onClick={() => setShowEmployeeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Colaborador / Satélite</h2>
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
                <label>Cargo / Rol Operativo</label>
                <input type="text" required value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value})} placeholder="Ej: Confeccionista, Cortador, Diseñadora, Estampador" />
              </div>
              <button type="submit" className="btn-submit">Crear Colaborador</button>
            </form>
          </div>
        </div>
      )}

      {/* ESTILOS CSS EJECUTIVOS */}
      <style>{`
        .finanzas-container { padding-bottom: 3rem; }
        
        .header-badge {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 900;
          color: var(--brand-primary);
          background: rgba(212, 255, 0, 0.1);
          border: 1px solid rgba(212, 255, 0, 0.25);
          padding: 0.25rem 0.6rem;
          border-radius: 4px;
          margin-bottom: 0.5rem;
          letter-spacing: 0.8px;
        }

        .finanzas-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 1.8rem; 
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .finanzas-header h1 { font-size: 2rem; font-weight: 900; margin: 0; color: white; }
        .finanzas-header p { color: rgba(255,255,255,0.6); margin: 0.5rem 0 0 0; font-size: 0.95rem; }
        .text-primary { color: var(--brand-primary); }
        .text-green { color: #10b981; }
        .text-blue { color: #38bdf8; }
        .text-yellow { color: #f59e0b; }
        .text-red { color: #ef4444; }
        .font-bold { font-weight: 700; }
        .font-black { font-weight: 900; }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          flex-wrap: wrap;
        }

        .date-filter-wrap {
          display: flex;
          background: #111;
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 0.25rem;
          border-radius: 8px;
          gap: 0.25rem;
        }
        .btn-date-filter {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.45rem 0.85rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-date-filter.active {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }
        .btn-date-filter:hover:not(.active) {
          color: white;
        }

        .btn-export-pdf {
          background: rgba(56, 189, 248, 0.12);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.3);
          font-weight: 800;
          padding: 0.65rem 1.1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.2s;
        }
        .btn-export-pdf:hover {
          background: #38bdf8;
          color: black;
        }

        .btn-expense { 
          background: #ef4444; 
          color: white; 
          font-weight: 800; 
          padding: 0.65rem 1.2rem; 
          border-radius: 8px; 
          border: none; 
          cursor: pointer; 
          font-size: 0.85rem;
          transition: transform 0.15s;
        }
        .btn-expense:hover {
          transform: translateY(-2px);
        }

        /* SEMÁFORO DE SALUD FINANCIERA */
        .health-bar-card {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
          align-items: center;
          background: linear-gradient(180deg, #111 0%, #0c0c0c 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 1.5rem 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .health-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .health-label {
          font-size: 0.72rem;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 1px;
          margin-bottom: 0.3rem;
        }
        .health-value {
          font-size: 1.9rem;
          font-weight: 900;
          margin-bottom: 0.2rem;
        }
        .health-sub {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
        }
        .health-divider {
          width: 1px;
          height: 50px;
          background: rgba(255, 255, 255, 0.08);
        }
        .text-danger-pulse {
          color: #ef4444;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        /* KPIS GRID */
        .kpi-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); 
          gap: 1.2rem; 
          margin-bottom: 2.2rem; 
        }
        .kpi-card { 
          background: #111; 
          padding: 1.4rem; 
          border-radius: 12px; 
          border: 1px solid rgba(255,255,255,0.06); 
          transition: transform 0.2s;
        }
        .kpi-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.15);
        }
        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .kpi-card h3 { 
          font-size: 0.8rem; 
          color: rgba(255,255,255,0.6); 
          text-transform: uppercase; 
          margin: 0;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .kpi-icon {
          font-size: 1.1rem;
        }
        .kpi-card .value { font-size: 1.85rem; font-weight: 900; margin-bottom: 0.3rem; }
        .kpi-card p { font-size: 0.78rem; color: rgba(255,255,255,0.4); margin: 0; line-height: 1.4; }
        
        .kpi-card.info .value { color: #38bdf8; }
        .kpi-card.success .value { color: #10b981; }
        .kpi-card.warning .value { color: #f59e0b; }
        .kpi-card.danger .value { color: #ef4444; }

        /* TABS */
        .tabs { 
          display: flex; 
          gap: 0.8rem; 
          margin-bottom: 2rem; 
          border-bottom: 1px solid rgba(255,255,255,0.1); 
          padding-bottom: 0.8rem; 
          overflow-x: auto;
        }
        .tab { 
          background: transparent; 
          border: 1px solid rgba(255,255,255,0.1); 
          color: rgba(255,255,255,0.6); 
          padding: 0.75rem 1.4rem; 
          border-radius: 8px; 
          cursor: pointer; 
          font-weight: 700; 
          font-size: 0.88rem;
          transition: all 0.2s; 
          white-space: nowrap;
        }
        .tab.active { 
          background: rgba(212,255,0,0.12); 
          color: var(--brand-primary); 
          border-color: var(--brand-primary); 
        }
        .tab:hover:not(.active) { background: rgba(255,255,255,0.06); color: white; }

        /* COLUMNAS DE ANÁLISIS */
        .dashboard-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .analysis-box {
          background: #111;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 1.5rem;
        }
        .analysis-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 0.7rem;
        }
        .analysis-header h3 {
          font-size: 1rem;
          font-weight: 800;
          color: white;
          margin: 0;
        }
        .sub-tag {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }
        .btn-link-tab {
          background: transparent;
          border: none;
          color: var(--brand-primary);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-link-tab:hover {
          text-decoration: underline;
        }

        /* BARRAS DE CATEGORÍA */
        .category-bars {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .bar-row {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .bar-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
        }
        .bar-label {
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
        }
        .bar-val {
          color: rgba(255, 255, 255, 0.6);
          font-family: monospace;
        }
        .bar-track {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 999px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #ef4444, #f59e0b);
          border-radius: 999px;
        }

        /* LISTA DE DEUDAS */
        .debt-list {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .debt-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.85rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
        }
        .debt-item.item-risk {
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.05);
        }
        .debt-title {
          font-size: 0.88rem;
          color: white;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-wrap: wrap;
        }
        .risk-tag {
          font-size: 0.68rem;
          font-weight: 800;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.15);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
        }
        .debt-sub {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.45);
          margin-top: 0.2rem;
        }
        .debt-action-wrap {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }
        .debt-balance {
          font-size: 1rem;
          font-weight: 900;
          color: #f59e0b;
        }
        .btn-quick-pay {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.35rem 0.65rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-quick-pay:hover {
          background: #10b981;
          color: black;
        }

        /* FILTROS CARTERA */
        .cartera-filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .search-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 260px;
        }
        .search-icon {
          position: absolute;
          left: 1rem;
          color: rgba(255, 255, 255, 0.4);
        }
        .search-input-wrap input {
          width: 100%;
          background: #111;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        .risk-filter-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .filter-chip {
          background: #111;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.55rem 0.9rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-chip.active {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border-color: rgba(255, 255, 255, 0.3);
        }
        .filter-chip.chip-risk.active {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border-color: #ef4444;
        }

        /* TABLAS */
        .section-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 1.2rem; 
          flex-wrap: wrap;
          gap: 0.8rem;
        }
        .section-header h2 { color: white; margin: 0; font-size: 1.3rem; font-weight: 800; }
        .section-desc { font-size: 0.85rem; color: rgba(255, 255, 255, 0.5); margin: 0.3rem 0 0 0; }
        .btn-secondary { 
          background: rgba(255,255,255,0.08); 
          color: white; 
          font-weight: 700; 
          padding: 0.6rem 1.2rem; 
          border-radius: 6px; 
          border: 1px solid rgba(255,255,255,0.1); 
          cursor: pointer; 
          transition: background 0.2s; 
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.18); }

        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; background: #111; border-radius: 10px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.06); }
        .data-table th { background: #161616; padding: 1rem; text-align: left; font-size: 0.8rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px; }
        .data-table td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: white; font-size: 0.9rem; }
        .data-table tr:hover td { background: rgba(255, 255, 255, 0.02); }
        .data-table tr.row-risk td { background: rgba(239, 68, 68, 0.03); }
        
        .badge { background: rgba(255,255,255,0.1); padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
        .badge-risk { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        .badge-active { background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.25); }
        
        .cell-sub { font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); margin-top: 0.2rem; }
        .btn-pay-action {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
          font-weight: 800;
          padding: 0.45rem 0.9rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s;
        }
        .btn-pay-action:hover {
          background: #10b981;
          color: black;
        }

        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        .empty-text { color: rgba(255, 255, 255, 0.45); font-size: 0.9rem; padding: 1.5rem 0; text-align: center; }

        /* MODAL */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem; }
        .modal-content { background: #111; border: 1px solid rgba(255,255,255,0.15); width: 100%; max-width: 480px; border-radius: 14px; padding: 2rem; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; }
        .modal-header h2 { margin: 0; color: white; font-size: 1.2rem; font-weight: 800; }
        .btn-close { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 1.8rem; cursor: pointer; }
        .btn-close:hover { color: white; }

        .order-payment-info {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 1rem;
          font-size: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .balance-highlight {
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: #f59e0b;
          font-size: 1rem;
          font-weight: 900;
        }

        .expense-form { display: flex; flex-direction: column; gap: 1.1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .form-group label { color: rgba(255,255,255,0.7); font-size: 0.8rem; text-transform: uppercase; font-weight: 700; }
        .form-group input, .form-group select, .form-group textarea { background: #1a1a1a; border: 1px solid rgba(255,255,255,0.15); color: white; padding: 0.85rem; border-radius: 6px; font-size: 0.95rem; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--brand-primary); }
        
        .btn-pay-full {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px dashed rgba(245, 158, 11, 0.4);
          padding: 0.6rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-pay-full:hover {
          background: #f59e0b;
          color: black;
          border-style: solid;
        }

        .btn-submit { background: var(--brand-primary); color: black; font-weight: 800; padding: 0.9rem; border: none; border-radius: 6px; cursor: pointer; text-transform: uppercase; margin-top: 0.5rem; font-size: 0.9rem; transition: transform 0.2s; }
        .btn-submit:hover:not(:disabled) { transform: translateY(-2px); }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .spinner {
          width: 38px;
          height: 38px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: var(--brand-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .health-bar-card {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .health-divider {
            display: none;
          }
          .dashboard-columns {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
