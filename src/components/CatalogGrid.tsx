"use client";

import React, { useState } from 'react';

const CATEGORIES = [
  { id: 'todos', label: 'Todos' },
  { id: 'fuego', label: 'Fuego (Rojos)', color: 'rgba(255, 50, 50, 0.5)' },
  { id: 'agua', label: 'Agua (Azules)', color: 'rgba(0, 150, 255, 0.5)' },
  { id: 'tierra', label: 'Tierra (Verdes)', color: 'rgba(50, 200, 50, 0.5)' },
  { id: 'tormenta', label: 'Tormenta (Neón)', color: 'rgba(212, 255, 0, 0.5)' },
  { id: 'eter', label: 'Éter (Blancos/Negros)', color: 'rgba(255, 255, 255, 0.3)' }
];

// Datos mockeados con categorías y colores de resplandor
const mockUniforms = [
  { id: 'um-f1', sku: 'SKU-FUEGO-01', name: 'Inferno V1', category: 'fuego', glow: 'rgba(255, 50, 50, 0.5)', image: '/catalog/fuego-1.jpg' },
  { id: 'um-f2', sku: 'SKU-FUEGO-02', name: 'Volcano X', category: 'fuego', glow: 'rgba(255, 50, 50, 0.5)', image: '/catalog/fuego-2.jpg' },
  { id: 'um-a1', sku: 'SKU-AGUA-01', name: 'Tsunami Pro', category: 'agua', glow: 'rgba(0, 150, 255, 0.5)', image: '/catalog/agua-1.jpg' },
  { id: 'um-a2', sku: 'SKU-AGUA-02', name: 'Ocean Depth', category: 'agua', glow: 'rgba(0, 150, 255, 0.5)', image: '/catalog/fuego-2.jpg' }, // Reusando una de fuego para la otra de agua por ahora
  { id: 'um-t1', sku: 'SKU-TIERRA-01', name: 'Forest Elite', category: 'tierra', glow: 'rgba(50, 200, 50, 0.5)', image: '/catalog/fuego-1.jpg' },
  { id: 'um-t2', sku: 'SKU-TIERRA-02', name: 'Mountain Peak', category: 'tierra', glow: 'rgba(50, 200, 50, 0.5)', image: '/catalog/fuego-2.jpg' },
  { id: 'um-tr1', sku: 'SKU-STORM-01', name: 'Volt Strike', category: 'tormenta', glow: 'rgba(212, 255, 0, 0.5)', image: '/catalog/tormenta-1.jpg' },
  { id: 'um-e1', sku: 'SKU-ETER-01', name: 'Phantom Dark', category: 'eter', glow: 'rgba(255, 255, 255, 0.3)', image: '/catalog/tormenta-2.jpg' },
];

export default function CatalogGrid() {
  const [activeCategory, setActiveCategory] = useState('todos');

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
                >
                  Cotizar este SKU
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

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
        
        /* Efecto 3D de resplandor usando la variable CSS inyectada */
        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at center, var(--glow-color) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.5s ease;
          pointer-events: none;
          z-index: 1;
        }

        .card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.8);
          border-color: var(--brand-primary);
        }
        
        .card:hover::before {
          opacity: 0.6;
        }

        .card-image-wrapper {
          position: relative;
          aspect-ratio: 4/5;
          overflow: hidden;
          background: #111;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2; /* Por encima del resplandor */
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
          object-fit: contain; /* Ajustado para que los PNG transparentes no se recorten */
          transition: transform 0.5s ease;
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
      `}</style>
    </section>
  );
}
