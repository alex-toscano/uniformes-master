"use client";

import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const CATEGORIES = [
  { id: 'todos', label: 'Todos' },
  { id: 'fuego', label: 'Fuego (Rojos)', color: 'rgba(255, 50, 50, 0.5)' },
  { id: 'agua', label: 'Agua (Azules)', color: 'rgba(0, 150, 255, 0.5)' },
  { id: 'tierra', label: 'Tierra (Verdes)', color: 'rgba(50, 200, 50, 0.5)' },
  { id: 'tormenta', label: 'Tormenta (Neón)', color: 'rgba(212, 255, 0, 0.5)' },
  { id: 'eter', label: 'Éter (Blancos/Negros)', color: 'rgba(255, 255, 255, 0.3)' }
];

import catalogData from '../data/catalogData.json';

// Usar los datos generados por el script
const mockUniforms = catalogData;

export default function CatalogGrid() {
  const [activeCategory, setActiveCategory] = useState('todos');
  const [selectedUniform, setSelectedUniform] = useState<any>(null);
  const [zoomLensPos, setZoomLensPos] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadData, setLeadData] = useState({
    nombre: '',
    escuela: '',
    cantidad: '10 a 20'
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current || !containerRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x > rect.width) x = rect.width;
    if (y > rect.height) y = rect.height;

    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    setZoomLensPos({ x: xPercent, y: yPercent });
    setIsZooming(true);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Guardar en Supabase
      const { error } = await supabase
        .from('leads')
        .insert([
          {
            nombre: leadData.nombre,
            escuela: leadData.escuela,
            cantidad_estimada: leadData.cantidad,
            sku_interes: selectedUniform.sku,
            fecha: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Error al guardar lead en Supabase:', error);
        // Continuamos de todos modos para no bloquear la venta
      }
    } catch (err) {
      console.error('Error inesperado:', err);
    } finally {
      setIsSubmitting(false);
      
      // Abrir WhatsApp
      const mensaje = `Hola, mi nombre es ${leadData.nombre} del equipo/escuela ${leadData.escuela}. Me interesa cotizar ${leadData.cantidad} uniformes del modelo SKU: ${selectedUniform.sku} (${selectedUniform.name}).`;
      const urlWa = `https://wa.me/573012815448?text=${encodeURIComponent(mensaje)}`;
      window.open(urlWa, '_blank');
      
      // Cerrar modal
      setSelectedUniform(null);
      setShowLeadForm(false);
      setLeadData({ nombre: '', escuela: '', cantidad: '10 a 20' });
    }
  };

  const closeModal = () => {
    setSelectedUniform(null);
    setShowLeadForm(false);
  };

  const filteredUniforms = mockUniforms.filter(u => 
    activeCategory === 'todos' ? true : u.category === activeCategory
  );

  return (
    <section id="catalogo" className="catalog">
      <div className="catalog-container">
        <div className="catalog-header">
          <h2 className="title">
            MÁS QUE UNIFORMES, <br />
            <span className="text-primary">IDENTIDAD DEPORTIVA.</span>
          </h2>
          <p className="subtitle">
            Descubre nuestras colecciones elementales. (Nota: Las imágenes actuales son marcadores de posición temporales hasta que subas los PNGs sin fondo).
          </p>
        </div>

        <div className="tabs-container">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid">
          {filteredUniforms.map((uniform) => (
            <div 
              key={uniform.id} 
              className="card"
              style={{ '--glow-color': uniform.glow } as React.CSSProperties}
              onClick={() => setSelectedUniform(uniform)}
            >
              <div className="card-image-wrapper">
                <span className="badge">NUEVO</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={uniform.image} 
                  alt={uniform.name} 
                  className="card-img"
                  loading="lazy"
                />
              </div>
              <div className="card-content">
                <span className="sku">{uniform.sku}</span>
                <h3 className="name">{uniform.name}</h3>
                <a 
                  href={`https://wa.me/573012815448?text=Hola%20Uniformes%20Master,%20quiero%20cotizar%20el%20uniforme%20con%20SKU:%20${uniform.sku}%20(${uniform.name})`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-cotizar"
                  onClick={(e) => e.stopPropagation()}
                >
                  Cotizar este SKU
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* E-COMMERCE MODAL */}
      {selectedUniform && (
        <div className="ecommerce-overlay" onClick={closeModal}>
          <button className="ecommerce-close" onClick={closeModal}>&times;</button>
          
          <div className="ecommerce-modal" onClick={(e) => e.stopPropagation()}>
            {/* Lado de la Imagen */}
            <div 
              className="ecommerce-image-container"
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onMouseEnter={() => setIsZooming(true)}
            >
              <img 
                ref={imgRef}
                src={selectedUniform.image} 
                alt={selectedUniform.name} 
                className="ecommerce-img" 
              />
              {isZooming && (
                <div 
                  className="zoom-lens" 
                  style={{
                    left: `${zoomLensPos.x}%`,
                    top: `${zoomLensPos.y}%`
                  }}
                />
              )}
              <div className="zoom-hint">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                Pasa el cursor para inspeccionar detalles
              </div>
            </div>

            {/* Lado de la Información de Ventas o Panel de Zoom */}
            <div className="ecommerce-info-container">
              {isZooming ? (
                <div 
                  className="ecommerce-zoom-pane"
                  style={{
                    backgroundImage: `url(${selectedUniform.image})`,
                    backgroundPosition: `${zoomLensPos.x}% ${zoomLensPos.y}%`,
                    backgroundSize: '250%'
                  }}
                />
              ) : showLeadForm ? (
                <div className="lead-form-container">
                  <h3 className="lead-form-title">¡Estás a un paso!</h3>
                  <p className="lead-form-subtitle">Déjanos unos datos rápidos para darte la mejor cotización para tu equipo.</p>
                  
                  <form onSubmit={handleLeadSubmit} className="lead-form">
                    <div className="form-group">
                      <label>Nombre y Apellido</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ej: Carlos Ramírez"
                        value={leadData.nombre}
                        onChange={(e) => setLeadData({...leadData, nombre: e.target.value})}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Nombre del Equipo o Escuela</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ej: Club Los Leones"
                        value={leadData.escuela}
                        onChange={(e) => setLeadData({...leadData, escuela: e.target.value})}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Cantidad Estimada</label>
                      <select 
                        value={leadData.cantidad}
                        onChange={(e) => setLeadData({...leadData, cantidad: e.target.value})}
                      >
                        <option value="10 a 20">10 a 20 uniformes</option>
                        <option value="20 a 50">20 a 50 uniformes</option>
                        <option value="Más de 50">Más de 50 uniformes</option>
                      </select>
                    </div>

                    <button type="submit" className="btn-cotizar-huge btn-submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Conectando...' : 'Enviar y Hablar con Asesor'}
                    </button>
                    <button type="button" className="btn-back" onClick={() => setShowLeadForm(false)}>
                      Volver a detalles del uniforme
                    </button>
                  </form>
                </div>
              ) : (
                <div className="ecommerce-info">
                  <span className="ecommerce-sku">SKU: {selectedUniform.sku}</span>
                  <h2 className="ecommerce-title">{selectedUniform.name}</h2>
                  <p className="ecommerce-category">Colección {selectedUniform.category.toUpperCase()}</p>
                  
                  <div className="ecommerce-divider"></div>
                  
                  <p className="ecommerce-description">
                    {selectedUniform.description || 'Diseño de alto rendimiento antitranspirante y costuras reforzadas.'}
                  </p>
                  
                  <div className="ecommerce-guarantee">
                    <div className="guarantee-item">✓ Envíos a toda Colombia</div>
                    <div className="guarantee-item">✓ Calidad Premium Garantizada</div>
                    <div className="guarantee-item">✓ Fabricación desde 10 unidades</div>
                  </div>

                  <button 
                    onClick={() => setShowLeadForm(true)}
                    className="btn-cotizar-huge"
                  >
                    Cotizar Ahora por WhatsApp
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .catalog {
          padding: 6rem 2rem;
          background-color: var(--background);
        }
        .catalog-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .catalog-header {
          text-align: center;
          margin-bottom: 4rem;
        }
        .title {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 1rem;
          text-transform: uppercase;
        }
        .text-primary {
          color: var(--brand-primary);
        }
        .subtitle {
          color: #d1d5db;
          max-width: 600px;
          margin: 0 auto;
          font-size: 1.1rem;
        }
        
        .tabs-container {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 4rem;
        }
        
        .tab-btn {
          padding: 0.75rem 1.5rem;
          border-radius: 30px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.02);
          color: #fff;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.9rem;
          letter-spacing: 1px;
          transition: all 0.3s ease;
        }
        .tab-btn:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.2);
        }
        .tab-btn.active {
          background: var(--brand-primary);
          color: #000;
          border-color: var(--brand-primary);
          box-shadow: 0 0 15px rgba(212, 255, 0, 0.4);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2.5rem;
        }
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          transition: var(--transition);
          position: relative;
        }
        
        /* Eliminamos el ::before de la card entera */
        .card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.8);
          border-color: var(--brand-primary);
          cursor: pointer;
        }

        .card-image-wrapper {
          position: relative;
          aspect-ratio: 4/5;
          overflow: hidden;
          background: #0a0a0a; /* Fondo más oscuro para resaltar el neón */
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Efecto 3D de resplandor ADENTRO del contenedor de la imagen */
        .card-image-wrapper::before {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 150%; height: 150%;
          background: radial-gradient(circle at center, var(--glow-color) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.5s ease;
          pointer-events: none;
          z-index: 1;
        }
        
        .card:hover .card-image-wrapper::before {
          opacity: 1; /* Brillo más intenso al hacer hover */
        }

        .badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: var(--brand-primary);
          color: #000;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          z-index: 3;
        }
        .card-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.5s ease;
          position: relative;
          z-index: 2; /* Por encima del resplandor */
          /* Drop shadow extra en la prenda para dar más volumen 3D */
          filter: drop-shadow(0px 15px 15px rgba(0,0,0,0.6));
        }
        .card:hover .card-img {
          transform: scale(1.1);
        }
        .card-content {
          padding: 1.5rem;
          text-align: center;
          position: relative;
          z-index: 2;
          background: var(--surface); /* Para tapar el resplandor en la zona de texto */
        }
        .sku {
          display: block;
          color: var(--brand-primary);
          font-size: 0.85rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .name {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: #fff;
        }
        .btn-cotizar {
          display: inline-block;
          width: 100%;
          padding: 0.75rem;
          background: transparent;
          color: #fff;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          font-weight: 600;
          transition: var(--transition);
        }
        .card:hover .btn-cotizar {
          background: var(--brand-primary);
          color: #000;
          border-color: var(--brand-primary);
        }

        /* E-COMMERCE UI STYLES */
        .ecommerce-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(8px);
          animation: fadeIn 0.3s ease;
          padding: 2rem;
        }
        .ecommerce-close {
          position: absolute;
          top: 2rem;
          right: 3rem;
          background: transparent;
          border: none;
          color: white;
          font-size: 3rem;
          cursor: pointer;
          transition: color 0.2s;
          z-index: 10000;
        }
        .ecommerce-close:hover {
          color: var(--brand-primary);
        }
        
        .ecommerce-modal {
          display: flex;
          background: #111;
          border-radius: var(--radius);
          overflow: hidden;
          max-width: 1200px;
          width: 100%;
          max-height: 90vh;
          box-shadow: 0 30px 60px rgba(0,0,0,0.8);
          border: 1px solid #333;
          animation: slideUp 0.4s ease;
        }

        /* Lado Izquierdo: Imagen interactiva */
        .ecommerce-image-container {
          flex: 1;
          position: relative;
          background: #0a0a0a;
          overflow: hidden; /* Importante para que el zoom no se salga */
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: crosshair; /* Cursor que indica inspección */
          min-height: 500px;
        }
        .ecommerce-zoom-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s ease-out; /* Suaviza el movimiento del mouse */
        }
        .ecommerce-img {
          width: 80%;
          max-height: 80vh;
          object-fit: contain;
          filter: drop-shadow(0px 20px 40px rgba(0,0,0,0.8));
        }
        .zoom-hint {
          position: absolute;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.6);
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.85rem;
          color: #d1d5db;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          pointer-events: none;
          border: 1px solid #333;
        }

        /* Lado Derecho: Info y Ventas */
        .ecommerce-info-container {
          flex: 1;
          position: relative;
        }
        .ecommerce-info {
          padding: 4rem 3rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100%;
        }
        .ecommerce-zoom-pane {
          position: absolute;
          inset: 0;
          background-repeat: no-repeat;
          border-left: 1px solid #333;
          z-index: 10;
          background-color: #111;
        }
        .zoom-lens {
          position: absolute;
          width: 120px;
          height: 120px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.5);
          transform: translate(-50%, -50%);
          pointer-events: none;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
          z-index: 5;
        }
        .ecommerce-sku {
          color: var(--brand-primary);
          font-weight: 700;
          font-size: 1rem;
          margin-bottom: 0.5rem;
          letter-spacing: 1px;
        }
        .ecommerce-title {
          font-size: 2.5rem;
          font-weight: 900;
          color: #fff;
          margin-bottom: 0.25rem;
          line-height: 1.1;
        }
        .ecommerce-category {
          color: #9ca3af;
          font-size: 1.1rem;
          margin-bottom: 2rem;
        }
        .ecommerce-divider {
          width: 50px;
          height: 4px;
          background: var(--brand-primary);
          margin-bottom: 2rem;
        }
        .ecommerce-description {
          font-size: 1.1rem;
          color: #d1d5db;
          line-height: 1.6;
          margin-bottom: 2.5rem;
        }
        .ecommerce-guarantee {
          background: rgba(255,255,255,0.02);
          border: 1px solid #222;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 3rem;
        }
        .guarantee-item {
          color: #fff;
          font-weight: 600;
          margin-bottom: 0.75rem;
          font-size: 1rem;
        }
        .guarantee-item:last-child {
          margin-bottom: 0;
        }
        .btn-cotizar-huge {
          background: var(--brand-primary);
          color: #000;
          font-size: 1.25rem;
          font-weight: 800;
          padding: 1.25rem 2rem;
          border-radius: var(--radius);
          text-align: center;
          text-transform: uppercase;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 10px 20px rgba(212, 255, 0, 0.2);
        }
        .btn-cotizar-huge:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(212, 255, 0, 0.4);
        }

        /* Lead Form Styles */
        .lead-form-container {
          padding: 3rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100%;
          background: #151515;
          border-left: 1px solid #333;
        }
        .lead-form-title {
          font-size: 2rem;
          color: var(--brand-primary);
          margin-bottom: 0.5rem;
          font-weight: 800;
        }
        .lead-form-subtitle {
          color: #9ca3af;
          margin-bottom: 2rem;
          font-size: 1rem;
        }
        .lead-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          color: #fff;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .form-group input, .form-group select {
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #333;
          background: #0a0a0a;
          color: #fff;
          font-size: 1rem;
          transition: border-color 0.3s;
        }
        .form-group input:focus, .form-group select:focus {
          outline: none;
          border-color: var(--brand-primary);
        }
        .btn-submit {
          margin-top: 1rem;
          cursor: pointer;
          border: none;
        }
        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btn-back {
          background: transparent;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 1rem;
          font-size: 0.9rem;
          transition: color 0.3s;
        }
        .btn-back:hover {
          color: #fff;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 900px) {
          .ecommerce-modal {
            flex-direction: column;
            overflow-y: auto;
          }
          .ecommerce-image-container {
            min-height: 350px;
          }
          .ecommerce-info {
            padding: 2rem;
          }
        }
      `}</style>
    </section>
  );
}
