'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  CatalogCategory, 
  CATEGORY_INFO, 
  detectDominantColor, 
  generateSKU, 
  formatDesignName, 
  ColorDetectionResult 
} from '@/utils/colorDetector'
import { toast, confirmModal } from '@/context/NotificationContext'

interface DesignUploadModalProps {
  onClose: () => void
  onDesignAdded?: () => void
}

export default function DesignUploadModal({ onClose, onDesignAdded }: DesignUploadModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'list'>('upload')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  // Datos del nuevo diseño
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState<CatalogCategory>('tormenta')
  const [glow, setGlow] = useState(CATEGORY_INFO.tormenta.glow)
  const [description, setDescription] = useState('')
  const [detectionResult, setDetectionResult] = useState<ColorDetectionResult | null>(null)

  // Lista de diseños existentes
  const [designs, setDesigns] = useState<any[]>([])
  const [loadingDesigns, setLoadingDesigns] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchDesigns()
  }, [])

  const fetchDesigns = async () => {
    setLoadingDesigns(true)
    try {
      const res = await fetch('/api/catalog/designs')
      if (res.ok) {
        const data = await res.json()
        setDesigns(data)
      }
    } catch (e) {
      console.error('Error cargando diseños:', e)
    } finally {
      setLoadingDesigns(false)
    }
  }

  const handleFileChange = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP).')
      return
    }

    setSelectedFile(file)
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    setAnalyzing(true)

    // Formatear nombre sugerido
    const suggestedName = formatDesignName(file.name)
    setName(suggestedName)

    // Cargar imagen para análisis de color
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = localUrl

    img.onload = async () => {
      try {
        const result = await detectDominantColor(img)
        setDetectionResult(result)
        setCategory(result.category)
        setGlow(result.glow)
        const autoSku = generateSKU(result.category)
        setSku(autoSku)
        setDescription(
          `Diseño ${suggestedName} de la colección ${result.category.toUpperCase()}. Confeccionado con microfibra antitranspirante y sublimación digital de alta definición.`
        )
        toast.success(`¡Color analizado! Categoría sugerida: ${result.categoryLabel}`)
      } catch (err) {
        console.error('Error analizando color:', err)
        const fallbackSku = generateSKU('tormenta')
        setSku(fallbackSku)
      } finally {
        setAnalyzing(false)
      }
    }

    img.onerror = () => {
      setAnalyzing(false)
      toast.error('Error al procesar la imagen seleccionada.')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleRegenerateSku = () => {
    const newSku = generateSKU(category)
    setSku(newSku)
  }

  const handleCategoryChange = (newCat: CatalogCategory) => {
    setCategory(newCat)
    setGlow(CATEGORY_INFO[newCat].glow)
    setSku(generateSKU(newCat))
  }

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      toast.error('Debes seleccionar o arrastrar una imagen del diseño.')
      return
    }
    if (!name.trim()) {
      toast.error('El nombre del uniforme es obligatorio.')
      return
    }
    if (!sku.trim()) {
      toast.error('El SKU es obligatorio.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('name', name.trim())
      formData.append('sku', sku.trim().toUpperCase())
      formData.append('category', category)
      formData.append('glow', glow)
      formData.append('description', description.trim())

      const res = await fetch('/api/catalog/designs', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(`¡Diseño "${name}" publicado con éxito en el catálogo!`)
        // Reset form
        setSelectedFile(null)
        setPreviewUrl(null)
        setName('')
        setSku('')
        setDescription('')
        setDetectionResult(null)
        fetchDesigns()
        window.dispatchEvent(new CustomEvent('catalog-designs-updated'))
        onDesignAdded?.()
      } else {
        toast.error(`Error al publicar: ${data.error || 'Error desconocido'}`)
      }
    } catch (err: any) {
      toast.error(`Error al procesar subida: ${err?.message || 'Error de red'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (skuToDelete: string, designName: string) => {
    const confirmed = await confirmModal({
      title: 'Eliminar Diseño del Catálogo',
      message: `¿Seguro que deseas retirar el diseño "${designName}" (${skuToDelete}) del catálogo?`,
      confirmText: 'Sí, eliminar',
      type: 'danger'
    })
    if (!confirmed) return

    try {
      const res = await fetch('/api/catalog/designs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: skuToDelete })
      })
      if (res.ok) {
        toast.success(`Diseño "${designName}" retirado del catálogo.`)
        fetchDesigns()
        window.dispatchEvent(new CustomEvent('catalog-designs-updated'))
        onDesignAdded?.()
      } else {
        toast.error('Error al retirar diseño.')
      }
    } catch {
      toast.error('Error al conectar con el servidor.')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content design-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>🎨 Gestor Inteligente de Colecciones</h2>
            <p className="subtitle">Sube fotos de nuevos diseños. La IA analiza el color dominante, clasifica la colección y genera el SKU automáticamente.</p>
          </div>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`} 
            onClick={() => setActiveTab('upload')}
          >
            ⚡ Subir Nuevo Diseño
          </button>
          <button 
            className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`} 
            onClick={() => setActiveTab('list')}
          >
            📚 Diseños Creados ({designs.length})
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'upload' && (
            <form onSubmit={handlePublish} className="upload-grid">
              {/* ZONA DE CARGA Y PREVISUALIZACIÓN */}
              <div className="preview-column">
                <div 
                  className={`dropzone ${previewUrl ? 'has-image' : ''}`}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0])} 
                    accept="image/png,image/jpeg,image/webp" 
                    style={{ display: 'none' }}
                  />

                  {previewUrl ? (
                    <div className="image-wrapper">
                      <img 
                        src={previewUrl} 
                        alt="Previsualización" 
                        className="preview-img"
                        style={{ filter: `drop-shadow(0 0 25px ${glow})` }}
                      />
                      <div className="change-overlay">
                        <span>📸 Clic o arrastra para cambiar foto</span>
                      </div>
                    </div>
                  ) : (
                    <div className="dropzone-empty">
                      <div className="icon">📸</div>
                      <h4>Arrastra aquí la foto del uniforme</h4>
                      <p>O haz clic para seleccionar archivo desde tu dispositivo</p>
                      <span className="badge-format">PNG con fondo transparente recomendado</span>
                    </div>
                  )}
                </div>

                {/* BADGE DE DETECCIÓN INTELIGENTE */}
                {analyzing ? (
                  <div className="detection-card analyzing">
                    <span className="spinner">🌀</span> Analizando espectro de color y colección...
                  </div>
                ) : detectionResult ? (
                  <div className="detection-card success" style={{ borderColor: CATEGORY_INFO[category].color }}>
                    <div className="detection-header">
                      <span className="ai-tag">✨ IA de Color</span>
                      <span className="confidence-tag">{detectionResult.confidence}% precisión</span>
                    </div>
                    <div className="detection-body">
                      <div className="color-swatch-box">
                        <div 
                          className="swatch" 
                          style={{ backgroundColor: detectionResult.dominantHex, boxShadow: `0 0 10px ${detectionResult.dominantHex}` }} 
                        />
                        <span className="hex-text">{detectionResult.dominantHex}</span>
                      </div>
                      <div className="category-info">
                        <strong>Colección {category.toUpperCase()}</strong>
                        <small>Matiz: {detectionResult.hue}° • Sat: {detectionResult.saturation}%</small>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* FORMULARIO DE DATOS */}
              <div className="form-column">
                <div className="form-group">
                  <label>Nombre del Uniforme o Modelo *</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Ej: NEÓN MATRIX PRO 2025" 
                    required 
                    className="big-input"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Colección Asignada</label>
                    <select 
                      value={category} 
                      onChange={e => handleCategoryChange(e.target.value as CatalogCategory)}
                      className="category-select"
                      style={{ borderColor: CATEGORY_INFO[category].color }}
                    >
                      <option value="fuego">🔥 Fuego (Rojos / Naranjas)</option>
                      <option value="agua">💧 Agua (Azules / Celestes)</option>
                      <option value="tierra">🌿 Tierra (Verdes / Oliva)</option>
                      <option value="tormenta">⚡ Tormenta (Neón / Amarillos)</option>
                      <option value="eter">✨ Éter (Blancos / Negros / Neutros)</option>
                    </select>
                  </div>

                  <div className="form-group flex-1">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label style={{ margin: 0 }}>Código SKU Oficial *</label>
                      <button type="button" onClick={handleRegenerateSku} className="btn-link">⚡ Nuevo SKU</button>
                    </div>
                    <input 
                      type="text" 
                      value={sku} 
                      onChange={e => setSku(e.target.value.toUpperCase())} 
                      placeholder="SKU-TORMENTA-0001" 
                      required 
                      className="sku-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Descripción Comercial para el Catálogo</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Describe los detalles de la indumentaria..."
                    rows={4}
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-submit" 
                    disabled={loading || analyzing || !selectedFile}
                  >
                    {loading ? '🚀 Subiendo a la Nube y Publicando...' : '🚀 Publicar en Catálogo en Vivo'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'list' && (
            <div className="list-container">
              {loadingDesigns ? (
                <p className="empty-msg">Cargando colección...</p>
              ) : designs.length === 0 ? (
                <div className="empty-state">
                  <span className="icon">👕</span>
                  <h3>No hay diseños dinámicos creados aún</h3>
                  <p>Sube tu primera prenda con la pestaña "Subir Nuevo Diseño".</p>
                </div>
              ) : (
                <div className="designs-grid">
                  {designs.map(d => (
                    <div key={d.id || d.sku} className="design-card">
                      <div className="card-thumb" style={{ background: `radial-gradient(circle, ${d.glow || 'rgba(255,255,255,0.1)'} 0%, rgba(0,0,0,0.8) 70%)` }}>
                        <img src={d.image} alt={d.name} />
                        <span className={`badge-cat ${d.category}`}>{d.category?.toUpperCase()}</span>
                      </div>
                      <div className="card-info">
                        <h4>{d.name}</h4>
                        <span className="card-sku">{d.sku}</span>
                        <button 
                          onClick={() => handleDelete(d.sku, d.name)} 
                          className="btn-delete"
                          title="Eliminar del catálogo"
                        >
                          🗑️ Retirar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.88); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-content.design-modal {
          background: #0d0d0d; border: 1px solid rgba(255,255,255,0.12);
          width: 95%; max-width: 960px; border-radius: 14px; max-height: 92vh;
          display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8);
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 1.5rem 2rem; border-bottom: 1px solid rgba(255,255,255,0.06); background: #141414;
        }
        .modal-header h2 { margin: 0 0 0.3rem 0; color: white; font-weight: 900; font-size: 1.4rem; }
        .subtitle { margin: 0; color: rgba(255,255,255,0.5); font-size: 0.85rem; }
        .btn-close { background: none; border: none; color: rgba(255,255,255,0.6); font-size: 2rem; cursor: pointer; line-height: 1; }
        .btn-close:hover { color: white; }

        .modal-tabs {
          display: flex; gap: 1rem; padding: 0 2rem; border-bottom: 1px solid rgba(255,255,255,0.06); background: #111;
        }
        .tab-btn {
          background: transparent; border: none; color: rgba(255,255,255,0.5); padding: 1rem 0.5rem;
          font-weight: 700; font-size: 0.9rem; cursor: pointer; position: relative;
        }
        .tab-btn.active { color: var(--brand-primary); }
        .tab-btn.active::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: var(--brand-primary);
        }

        .modal-body { padding: 2rem; overflow-y: auto; flex: 1; }

        .upload-grid {
          display: grid; grid-template-columns: 1.1fr 1.4fr; gap: 2rem;
        }

        .dropzone {
          border: 2px dashed rgba(255,255,255,0.2); border-radius: 12px;
          min-height: 320px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s ease; background: rgba(255,255,255,0.02);
          position: relative; overflow: hidden;
        }
        .dropzone:hover { border-color: var(--brand-primary); background: rgba(212,255,0,0.02); }
        .dropzone-empty { text-align: center; padding: 2rem; }
        .dropzone-empty .icon { font-size: 3rem; margin-bottom: 0.8rem; }
        .dropzone-empty h4 { color: white; margin: 0 0 0.4rem 0; font-size: 1.1rem; }
        .dropzone-empty p { color: rgba(255,255,255,0.4); font-size: 0.85rem; margin: 0 0 1rem 0; }
        .badge-format {
          display: inline-block; background: rgba(255,255,255,0.05); color: #d4ff00;
          padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700;
        }

        .image-wrapper { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
        .preview-img { max-width: 100%; max-height: 300px; object-fit: contain; }
        .change-overlay {
          position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.75);
          color: white; font-size: 0.8rem; text-align: center; padding: 0.5rem; opacity: 0; transition: opacity 0.2s;
        }
        .dropzone:hover .change-overlay { opacity: 1; }

        .detection-card {
          margin-top: 1rem; border-radius: 8px; padding: 0.8rem 1rem; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .detection-card.analyzing { color: #facc15; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; }
        .detection-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .ai-tag { color: var(--brand-primary); font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .confidence-tag { background: rgba(255,255,255,0.1); color: white; padding: 0.1rem 0.5rem; border-radius: 10px; font-size: 0.7rem; font-weight: 700; }
        .detection-body { display: flex; align-items: center; gap: 1rem; }
        .color-swatch-box { display: flex; align-items: center; gap: 0.5rem; }
        .swatch { width: 26px; height: 26px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); }
        .hex-text { font-family: monospace; font-size: 0.85rem; color: white; font-weight: bold; }
        .category-info strong { color: white; font-size: 0.9rem; display: block; }
        .category-info small { color: rgba(255,255,255,0.5); font-size: 0.75rem; }

        .form-column { display: flex; flex-direction: column; gap: 1.2rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .form-group label { color: rgba(255,255,255,0.7); font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .form-group input, .form-group select, .form-group textarea {
          background: #111; border: 1px solid rgba(255,255,255,0.15); color: white;
          padding: 0.8rem; border-radius: 6px; font-size: 0.95rem; outline: none; transition: border-color 0.2s;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          border-color: var(--brand-primary);
        }
        .big-input { font-size: 1.1rem !important; font-weight: 700; text-transform: uppercase; }
        .sku-input { font-family: monospace; font-weight: bold; color: #d4ff00 !important; }
        .form-row { display: flex; gap: 1rem; }
        .flex-1 { flex: 1; }
        .btn-link { background: none; border: none; color: var(--brand-primary); font-size: 0.75rem; font-weight: bold; cursor: pointer; text-decoration: underline; padding: 0; }
        
        .btn-submit {
          width: 100%; background: var(--brand-primary); color: black; font-weight: 900;
          font-size: 1rem; padding: 1rem; border: none; border-radius: 8px; cursor: pointer;
          text-transform: uppercase; letter-spacing: 0.5px; transition: transform 0.1s, opacity 0.2s;
        }
        .btn-submit:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.1); }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        /* LISTA DE DISEÑOS */
        .designs-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1.5rem;
        }
        .design-card {
          background: #141414; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
          overflow: hidden; display: flex; flex-direction: column;
        }
        .card-thumb {
          height: 180px; display: flex; align-items: center; justify-content: center;
          padding: 1rem; position: relative;
        }
        .card-thumb img { max-width: 100%; max-height: 150px; object-fit: contain; }
        .badge-cat {
          position: absolute; top: 8px; right: 8px; font-size: 0.65rem; font-weight: 800;
          padding: 0.2rem 0.5rem; border-radius: 4px; text-transform: uppercase;
        }
        .badge-cat.fuego { background: rgba(255,50,50,0.2); color: #ff5555; border: 1px solid #ff5555; }
        .badge-cat.agua { background: rgba(0,150,255,0.2); color: #38bdf8; border: 1px solid #38bdf8; }
        .badge-cat.tierra { background: rgba(50,200,50,0.2); color: #4ade80; border: 1px solid #4ade80; }
        .badge-cat.tormenta { background: rgba(212,255,0,0.2); color: #d4ff00; border: 1px solid #d4ff00; }
        .badge-cat.eter { background: rgba(255,255,255,0.2); color: #ffffff; border: 1px solid #ffffff; }

        .card-info { padding: 1rem; display: flex; flex-direction: column; gap: 0.3rem; }
        .card-info h4 { margin: 0; color: white; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-sku { color: rgba(255,255,255,0.4); font-size: 0.75rem; font-family: monospace; }
        .btn-delete {
          margin-top: 0.5rem; background: rgba(255,50,50,0.1); color: #ff5555; border: 1px solid rgba(255,50,50,0.3);
          border-radius: 4px; padding: 0.4rem; font-size: 0.75rem; font-weight: bold; cursor: pointer; width: 100%;
        }
        .btn-delete:hover { background: #ff5555; color: black; }

        .empty-state { text-align: center; padding: 4rem 2rem; color: rgba(255,255,255,0.5); }
        .empty-state .icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
        .empty-state h3 { color: white; margin: 0 0 0.5rem 0; }

        @media (max-width: 768px) {
          .upload-grid { grid-template-columns: 1fr; }
          .form-row { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}
