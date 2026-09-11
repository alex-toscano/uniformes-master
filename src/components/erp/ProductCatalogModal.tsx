'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { formatThousands, parseThousands } from '@/utils/formatters'
import { toast, confirmModal } from '@/context/NotificationContext'
import {
  BaseProduct,
  fetchBaseProducts,
  saveBaseProduct,
  updateBaseProduct,
  deleteBaseProduct,
  DEFAULT_CATEGORIES
} from '@/utils/productCatalog'

export default function ProductCatalogModal({ onClose }: { onClose: () => void }) {
  const supabase = createClient()
  const [products, setProducts] = useState<BaseProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Formulario para nuevo ítem
  const [showNewForm, setShowNewForm] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [newPrices, setNewPrices] = useState({
    Infantil: '',
    Juvenil: '',
    Adulto: ''
  })

  // Edición de ítem existente
  const [editingProduct, setEditingProduct] = useState<BaseProduct | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrices, setEditPrices] = useState({
    Infantil: '',
    Juvenil: '',
    Adulto: ''
  })

  useEffect(() => {
    loadCatalog()
  }, [])

  const loadCatalog = async () => {
    setLoading(true)
    const list = await fetchBaseProducts(supabase)
    setProducts(list)
    setLoading(false)
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProductName.trim()) {
      toast.warning('Ingresa el nombre del producto o prenda.')
      return
    }

    const priceAdulto = parseThousands(newPrices.Adulto)
    const priceInfantil = parseThousands(newPrices.Infantil) || priceAdulto
    const priceJuvenil = parseThousands(newPrices.Juvenil) || priceAdulto

    if (priceAdulto <= 0 && priceInfantil <= 0 && priceJuvenil <= 0) {
      toast.warning('Por favor ingresa al menos un precio válido.')
      return
    }

    setSaving(true)
    try {
      await saveBaseProduct(supabase, newProductName.trim(), {
        Infantil: priceInfantil,
        Juvenil: priceJuvenil,
        Adulto: priceAdulto
      })
      toast.success(`Producto "${newProductName.trim()}" agregado al catálogo.`)
      setNewProductName('')
      setNewPrices({ Infantil: '', Juvenil: '', Adulto: '' })
      setShowNewForm(false)
      loadCatalog()
    } catch (err: any) {
      toast.error(`Error al crear producto: ${err.message || 'Error desconocido'}`)
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (p: BaseProduct) => {
    setEditingProduct(p)
    setEditName(p.name)
    setEditPrices({
      Infantil: formatThousands(p.prices.Infantil || ''),
      Juvenil: formatThousands(p.prices.Juvenil || ''),
      Adulto: formatThousands(p.prices.Adulto || '')
    })
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct || !editName.trim()) return

    const priceAdulto = parseThousands(editPrices.Adulto)
    const priceInfantil = parseThousands(editPrices.Infantil) || priceAdulto
    const priceJuvenil = parseThousands(editPrices.Juvenil) || priceAdulto

    setSaving(true)
    try {
      await updateBaseProduct(supabase, editingProduct.name, editName.trim(), {
        Infantil: priceInfantil,
        Juvenil: priceJuvenil,
        Adulto: priceAdulto
      })
      toast.success(`Producto "${editName.trim()}" actualizado correctamente.`)
      setEditingProduct(null)
      loadCatalog()
    } catch (err: any) {
      toast.error(`Error al actualizar producto: ${err.message || 'Error desconocido'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProduct = async (productName: string) => {
    const confirmed = await confirmModal({
      title: 'Eliminar Ítem del Catálogo',
      message: `¿Estás seguro de que deseas eliminar "${productName}" del catálogo maestro?\n\nLos pedidos existentes no se verán afectados, pero ya no aparecerá como opción en nuevos pedidos ni en listas de precios.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    })
    if (!confirmed) return

    try {
      await deleteBaseProduct(supabase, productName)
      toast.success(`Producto "${productName}" eliminado del catálogo.`)
      loadCatalog()
    } catch (err: any) {
      toast.error(`Error al eliminar: ${err.message || 'Error desconocido'}`)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content catalog-modal">
        <div className="modal-header">
          <div>
            <span className="badge-tag">Administración & Operaciones</span>
            <h2>🏷️ Catálogo de Prendas y Tarifario Base</h2>
            <p className="subtitle">
              Gestiona los ítems predeterminados de la fábrica y sus precios base por categoría (Infantil, Juvenil, Adulto).
            </p>
          </div>
          <button onClick={onClose} type="button" className="btn-close">×</button>
        </div>

        <div className="modal-body">
          {/* BOTÓN O FORMULARIO PARA CREAR NUEVO ÍTEM */}
          {!showNewForm && !editingProduct && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowNewForm(true)}
                className="btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.65rem 1.25rem' }}
              >
                + Agregar Nuevo Ítem / Prenda
              </button>
            </div>
          )}

          {showNewForm && (
            <form onSubmit={handleCreateProduct} className="catalog-form-box">
              <div className="form-header">
                <h4>✨ Nuevo Ítem para el Catálogo</h4>
                <button type="button" onClick={() => setShowNewForm(false)} className="btn-close-sm">✕</button>
              </div>

              <div className="form-group">
                <label>Nombre de la Prenda o Ítem *</label>
                <input
                  type="text"
                  placeholder="Ej: Camisilla, Buzo de Arquero, Peto..."
                  value={newProductName}
                  onChange={e => setNewProductName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="prices-grid">
                <div className="form-group">
                  <label>Precio Infantil</label>
                  <div className="input-money">
                    <span>$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Ej. 35.000"
                      value={newPrices.Infantil}
                      onChange={e => setNewPrices({ ...newPrices, Infantil: formatThousands(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Precio Juvenil</label>
                  <div className="input-money">
                    <span>$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Ej. 38.000"
                      value={newPrices.Juvenil}
                      onChange={e => setNewPrices({ ...newPrices, Juvenil: formatThousands(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Precio Adulto *</label>
                  <div className="input-money">
                    <span>$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Ej. 40.000"
                      value={newPrices.Adulto}
                      onChange={e => setNewPrices({ ...newPrices, Adulto: formatThousands(e.target.value) })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowNewForm(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear Prenda'}
                </button>
              </div>
            </form>
          )}

          {editingProduct && (
            <form onSubmit={handleUpdateProduct} className="catalog-form-box editing-box">
              <div className="form-header">
                <h4>✏️ Modificar: {editingProduct.name}</h4>
                <button type="button" onClick={() => setEditingProduct(null)} className="btn-close-sm">✕</button>
              </div>

              <div className="form-group">
                <label>Nombre de la Prenda *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="prices-grid">
                <div className="form-group">
                  <label>Precio Infantil</label>
                  <div className="input-money">
                    <span>$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editPrices.Infantil}
                      onChange={e => setEditPrices({ ...editPrices, Infantil: formatThousands(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Precio Juvenil</label>
                  <div className="input-money">
                    <span>$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editPrices.Juvenil}
                      onChange={e => setEditPrices({ ...editPrices, Juvenil: formatThousands(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Precio Adulto</label>
                  <div className="input-money">
                    <span>$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editPrices.Adulto}
                      onChange={e => setEditPrices({ ...editPrices, Adulto: formatThousands(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setEditingProduct(null)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          )}

          {/* TABLA DE PRODUCTOS ACTUALES */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.6)' }}>
              Cargando catálogo maestro...
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="catalog-table">
                <thead>
                  <tr>
                    <th>Prenda / Ítem</th>
                    <th>Talla Infantil</th>
                    <th>Talla Juvenil</th>
                    <th>Talla Adulto</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.name}>
                      <td className="font-bold text-white">
                        <span className="product-tag">👕</span> {p.name}
                      </td>
                      <td>
                        <span className="price-tag">${(p.prices.Infantil || 0).toLocaleString('es-CO')}</span>
                      </td>
                      <td>
                        <span className="price-tag">${(p.prices.Juvenil || 0).toLocaleString('es-CO')}</span>
                      </td>
                      <td>
                        <span className="price-tag text-primary">${(p.prices.Adulto || 0).toLocaleString('es-CO')}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => startEditing(p)}
                            className="btn-action-edit"
                            title="Modificar nombre o precios"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.name)}
                            className="btn-action-delete"
                            title="Eliminar del catálogo"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
                        No hay prendas en el catálogo. Crea una arriba.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content.catalog-modal {
          background: #0d0d0d;
          border: 1px solid rgba(255, 255, 255, 0.12);
          width: 95%;
          max-width: 820px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9);
          animation: popIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.93); }
          to { opacity: 1; transform: scale(1); }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1.5rem 1.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: #111;
          border-radius: 14px 14px 0 0;
        }

        .badge-tag {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--brand-primary, #d4ff00);
          font-weight: 800;
          display: block;
          margin-bottom: 0.25rem;
        }

        .modal-header h2 {
          margin: 0;
          color: white;
          font-weight: 900;
          font-size: 1.35rem;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.55);
          font-size: 0.85rem;
          margin: 0.35rem 0 0 0;
          max-width: 600px;
        }

        .btn-close {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 2rem;
          cursor: pointer;
          line-height: 1;
        }

        .btn-close:hover {
          color: white;
        }

        .btn-close-sm {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.1rem;
          cursor: pointer;
        }

        .btn-close-sm:hover {
          color: white;
        }

        .modal-body {
          padding: 1.5rem 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          max-height: calc(85vh - 120px);
          overflow-y: auto;
        }

        .catalog-form-box {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(212, 255, 0, 0.25);
          border-radius: 10px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .catalog-form-box.editing-box {
          border-color: rgba(59, 130, 246, 0.35);
          background: rgba(59, 130, 246, 0.04);
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .form-header h4 {
          margin: 0;
          color: white;
          font-size: 1rem;
          font-weight: 800;
        }

        .prices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .form-group label {
          color: rgba(255, 255, 255, 0.75);
          font-weight: 600;
          font-size: 0.85rem;
        }

        .form-group input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.18);
          padding: 0.7rem 0.85rem;
          border-radius: 6px;
          color: white;
          font-size: 0.95rem;
          outline: none;
          font-family: inherit;
        }

        .form-group input:focus {
          border-color: var(--brand-primary, #d4ff00);
        }

        .input-money {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 6px;
          padding: 0.2rem 0.6rem;
        }

        .input-money span {
          color: rgba(255, 255, 255, 0.4);
          font-weight: 700;
          margin-right: 0.3rem;
        }

        .input-money input {
          background: transparent;
          border: none;
          padding: 0.5rem 0;
          width: 100%;
          outline: none;
          color: white;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .table-wrapper {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          overflow: hidden;
        }

        .catalog-table {
          width: 100%;
          border-collapse: collapse;
        }

        .catalog-table th {
          background: rgba(255, 255, 255, 0.03);
          padding: 0.85rem 1rem;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.45);
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .catalog-table td {
          padding: 0.95rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          font-size: 0.92rem;
          color: rgba(255, 255, 255, 0.85);
        }

        .product-tag {
          font-size: 1.1rem;
          margin-right: 0.3rem;
        }

        .price-tag {
          font-weight: 700;
          font-family: monospace;
          font-size: 0.95rem;
        }

        .text-primary {
          color: var(--brand-primary, #d4ff00);
        }

        .btn-action-edit {
          background: rgba(255, 255, 255, 0.08);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-action-edit:hover {
          background: rgba(255, 255, 255, 0.16);
        }

        .btn-action-delete {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.25);
          padding: 0.4rem 0.7rem;
          border-radius: 6px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-action-delete:hover {
          background: #ef4444;
          color: white;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 1.25rem 1.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          background: #111;
          border-radius: 0 0 14px 14px;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.08);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 0.65rem 1.25rem;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
        }

        .btn-primary {
          background: var(--brand-primary, #d4ff00);
          color: black;
          border: none;
          padding: 0.65rem 1.35rem;
          border-radius: 6px;
          font-weight: 900;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
