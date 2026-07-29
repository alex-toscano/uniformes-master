'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import PricingModal from '@/components/erp/PricingModal'
import EditCustomerModal from '@/components/erp/EditCustomerModal'

type Customer = {
  id: string
  name: string
  school_or_club: string
  city: string
  phone: string
  address: string
  created_at: string
  orders: { id: string }[]
}

export default function CRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()
  
  const [pricingCustomer, setPricingCustomer] = useState<{id: string, name: string} | null>(null)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*, orders(id)')
    
    if (data && !error) {
      const sorted = (data as Customer[]).sort((a, b) => b.orders.length - a.orders.length)
      setCustomers(sorted)
    }
    setLoading(false)
  }

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.school_or_club && c.school_or_club.toLowerCase().includes(search.toLowerCase())) ||
    (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
  )

  if (loading) return <div className="text-white p-8 text-center">Cargando directorio...</div>

  return (
    <div className="crm-container">
      <div className="crm-header">
        <div>
          <h1 className="title">Directorio de <span className="text-primary">Clientes</span></h1>
          <p className="subtitle">Gestiona toda tu base de clientes y visualiza su fidelidad.</p>
        </div>
        
        <input 
          type="search" 
          placeholder="🔍 Buscar por nombre, club o ciudad..." 
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="metrics-row">
        <div className="metric-card">
          <h4>Total Clientes Registrados</h4>
          <span className="metric-value">{customers.length}</span>
        </div>
        {customers.length > 0 && (
          <div className="metric-card best-customer">
            <h4>Mejor Cliente (Top 1)</h4>
            <span className="metric-value text-primary">{customers[0].name}</span>
            <span className="metric-sub">{customers[0].school_or_club} - {customers[0].orders.length} pedidos históricos</span>
          </div>
        )}
      </div>

      <div className="table-responsive">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Cliente / Contacto</th>
              <th>Escuela o Club</th>
              <th>Ciudad</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Total Pedidos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td className="font-bold">{c.name}</td>
                <td>{c.school_or_club || '-'}</td>
                <td>{c.city || '-'}</td>
                <td>{c.phone || '-'}</td>
                <td>{c.address || '-'}</td>
                <td>
                  <span className="order-badge">{c.orders.length}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                      className="btn-edit-prices"
                      onClick={() => setPricingCustomer({ id: c.id, name: c.name })}
                    >
                      Configurar Precios
                    </button>
                    <button 
                      className="btn-edit-prices"
                      onClick={() => setEditCustomer(c)}
                    >
                      Editar Perfil
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-4">No se encontraron clientes.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pricingCustomer && (
        <PricingModal 
          customerId={pricingCustomer.id}
          customerName={pricingCustomer.name}
          onClose={() => setPricingCustomer(null)}
        />
      )}

      {editCustomer && (
        <EditCustomerModal
          customer={editCustomer}
          onClose={() => setEditCustomer(null)}
          onUpdated={fetchCustomers}
        />
      )}

      <style>{`
        .crm-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .crm-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .title {
          font-size: 2rem;
          font-weight: 900;
          color: white;
          margin: 0 0 0.5rem 0;
        }
        .text-primary { color: var(--brand-primary); }
        .subtitle {
          color: rgba(255,255,255,0.5);
          margin: 0;
        }
        .search-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 0.8rem 1rem;
          border-radius: 8px;
          color: white;
          min-width: 300px;
          outline: none;
        }
        .search-input:focus { border-color: var(--brand-primary); }
        
        .metrics-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        .metric-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 1.5rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
        }
        .metric-card.best-customer {
          background: rgba(212, 255, 0, 0.03);
          border-color: rgba(212, 255, 0, 0.2);
        }
        .metric-card h4 {
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 1px;
          margin: 0 0 0.5rem 0;
        }
        .metric-value {
          font-size: 1.8rem;
          font-weight: 900;
          color: white;
        }
        .metric-sub {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.4);
          margin-top: 0.2rem;
        }

        .table-responsive {
          width: 100%;
          overflow-x: auto;
          background: rgba(255,255,255,0.01);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
        }
        .crm-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
        }
        .crm-table th, .crm-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.8);
          font-size: 0.9rem;
        }
        .crm-table th {
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.4);
          background: rgba(0,0,0,0.2);
        }
        .crm-table tr:hover td {
          background: rgba(255,255,255,0.03);
        }
        .font-bold { font-weight: 700; color: white; }
        .text-center { text-align: center; }
        .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
        
        .order-badge {
          background: rgba(212, 255, 0, 0.15);
          color: var(--brand-primary);
          padding: 0.2rem 0.6rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.8rem;
        }
        .btn-edit-prices {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 0.4rem 0.8rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s;
        }
        .btn-edit-prices:hover {
          background: var(--brand-primary);
          color: black;
          border-color: var(--brand-primary);
        }
      `}</style>
    </div>
  )
}
