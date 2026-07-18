import catalogData from '../data/catalogData.json';
import Link from 'next/link';

// Mostrar solo 6 uniformes destacados en el home
const featured = catalogData.slice(0, 6);

export default function CatalogPreview() {
  return (
    <section className="preview-section">
      <div className="preview-container">

        {/* Header */}
        <div className="preview-header">
          <div className="slogan-block">
            <div className="slogan-line"></div>
            <p className="slogan-label">Colecciones 2025</p>
            <div className="slogan-line"></div>
          </div>
          <h2 className="preview-title">
            MÁS DE 100 DISEÑOS<br />
            <span className="text-primary">EXCLUSIVOS.</span>
          </h2>
          <p className="preview-subtitle">
            Cada uniforme es una declaración de identidad. Personalización total, calidad de competencia.
          </p>
        </div>

        {/* Grid de 6 */}
        <div className="preview-grid">
          {featured.map((uniform) => (
            <Link href="/catalogo" key={uniform.id} className="preview-card">
              <div
                className="preview-img-wrap"
                style={{ '--glow': uniform.glow } as React.CSSProperties}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uniform.image}
                  alt={uniform.name}
                  className="preview-img"
                  loading="lazy"
                />
                <div className="preview-overlay">
                  <span>Ver en catálogo</span>
                </div>
              </div>
              <div className="preview-info">
                <span className="preview-sku">{uniform.sku}</span>
                <h3 className="preview-name">{uniform.name}</h3>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA al catálogo completo */}
        <div className="preview-cta-wrap">
          <Link href="/catalogo" className="preview-cta-btn">
            Ver catálogo completo
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
          <p className="preview-cta-sub">+100 modelos disponibles · Filtros por color y categoría</p>
        </div>

      </div>

      <style>{`
        .preview-section {
          padding: 8rem 5vw;
          background: #050505;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .preview-container {
          max-width: 1600px;
          margin: 0 auto;
        }
        .preview-header {
          text-align: center;
          margin-bottom: 4rem;
        }
        .slogan-block {
          display: inline-flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .slogan-line {
          width: 30px;
          height: 1px;
          background: var(--brand-primary);
        }
        .slogan-label {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.35em;
          color: var(--brand-primary);
          text-transform: uppercase;
        }
        .preview-title {
          font-size: clamp(2.5rem, 6vw, 5rem);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -2px;
          color: #fff;
          line-height: 1.0;
          margin-bottom: 1.2rem;
        }
        .text-primary { color: var(--brand-primary); }
        .preview-subtitle {
          font-size: 1.1rem;
          color: rgba(255,255,255,0.4);
          max-width: 480px;
          margin: 0 auto;
          line-height: 1.7;
        }
        /* Grid 4 columnas desktop, 3 tablet, 2 mobile */
        .preview-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 4rem;
        }
        .preview-card {
          display: block;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          transition: all 0.35s ease;
          text-decoration: none;
          cursor: pointer;
        }
        .preview-card:hover {
          border-color: rgba(212,255,0,0.25);
          transform: translateY(-6px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.6);
        }
        .preview-img-wrap {
          position: relative;
          aspect-ratio: 4/5;
          overflow: hidden;
          background: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .preview-img-wrap::before {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 140%; height: 140%;
          background: radial-gradient(circle, var(--glow) 0%, transparent 65%);
          opacity: 0;
          transition: opacity 0.5s;
          pointer-events: none;
          z-index: 1;
        }
        .preview-card:hover .preview-img-wrap::before { opacity: 0.7; }
        .preview-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          position: relative;
          z-index: 2;
          transition: transform 0.5s ease;
          filter: drop-shadow(0 15px 20px rgba(0,0,0,0.7));
        }
        .preview-card:hover .preview-img { transform: scale(1.06); }
        .preview-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;
          z-index: 3;
        }
        .preview-card:hover .preview-overlay { opacity: 1; }
        .preview-overlay span {
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.4);
          padding: 0.6rem 1.4rem;
          border-radius: 4px;
          backdrop-filter: blur(4px);
        }
        .preview-info {
          padding: 1.25rem 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .preview-sku {
          display: block;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--brand-primary);
          margin-bottom: 0.35rem;
        }
        .preview-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.3;
        }
        /* CTA */
        .preview-cta-wrap {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .preview-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.15);
          padding: 1.1rem 2.5rem;
          border-radius: 4px;
          font-weight: 800;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          transition: all 0.3s;
        }
        .preview-cta-btn:hover {
          background: var(--brand-primary);
          color: #000;
          border-color: var(--brand-primary);
          box-shadow: 0 8px 30px rgba(212,255,0,0.3);
          transform: translateY(-2px);
        }
        .preview-cta-sub {
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: rgba(255,255,255,0.2);
          font-weight: 600;
        }
        @media (max-width: 1100px) {
          .preview-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 900px) {
          .preview-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .preview-section { padding: 5rem 1.5rem; }
          .preview-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
          .preview-title { letter-spacing: -1px; }
          .preview-cta-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </section>
  );
}
