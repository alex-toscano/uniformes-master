export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-overlay"></div>

      <div className="hero-content animate-fade-in">
        {/* Slogan */}
        <div className="slogan-block">
          <div className="slogan-line"></div>
          <p className="slogan-text">4 AÑOS VISTIENDO CAMPEONES</p>
          <div className="slogan-line"></div>
        </div>

        {/* Título Principal */}
        <h1 className="hero-title">
          EL UNIFORME DE<br />
          <span className="text-primary">LOS QUE GANAN.</span>
        </h1>

        <p className="hero-subtitle">
          Diseño personalizado, telas de alto rendimiento y la identidad visual que tu equipo merece. Fabricamos desde 10 unidades con entrega a toda Colombia.
        </p>

        {/* Stats de confianza */}
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">+4</span>
            <span className="stat-label">Años de experiencia</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number">+500</span>
            <span className="stat-label">Equipos vestidos</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number">32</span>
            <span className="stat-label">Departamentos</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="hero-cta">
          <a
            href="#catalogo"
            className="btn-hero-primary"
          >
            Ver Catálogo
          </a>
          <a
            href="https://wa.me/573012815448"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-hero-secondary"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Hablar con Asesor
          </a>
        </div>

        {/* Garantías rápidas */}
        <div className="hero-guarantees">
          <span className="guarantee-item">Entrega en 7-15 días</span>
          <span className="guarantee-dot">·</span>
          <span className="guarantee-item">Desde 10 unidades</span>
          <span className="guarantee-dot">·</span>
          <span className="guarantee-item">Envío a todo Colombia</span>
        </div>
      </div>

      <style>{`
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 10rem 5vw 6rem;
          background-color: #050505;
          background-image: url('/hero-bg.png');
          background-size: cover;
          background-position: center top;
          background-repeat: no-repeat;
          overflow: hidden;
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            rgba(5, 5, 5, 0.97) 0%,
            rgba(5, 5, 5, 0.85) 55%,
            rgba(5, 5, 5, 0.3) 100%
          );
          z-index: 1;
        }
        .hero-content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 900px;
        }
        .slogan-block {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .slogan-line {
          flex: 0 0 36px;
          height: 2px;
          background: var(--brand-primary);
        }
        .slogan-text {
          font-size: clamp(0.65rem, 1.2vw, 0.85rem);
          font-weight: 800;
          letter-spacing: 0.4em;
          color: var(--brand-primary);
          text-transform: uppercase;
          white-space: nowrap;
        }
        .hero-title {
          font-size: clamp(3.5rem, 8vw, 7rem);
          font-weight: 900;
          line-height: 1.0;
          margin-bottom: 1.8rem;
          text-transform: uppercase;
          letter-spacing: -3px;
          color: #fff;
        }
        .text-primary {
          color: var(--brand-primary);
          text-shadow: 0 0 40px rgba(212, 255, 0, 0.35);
        }
        .hero-subtitle {
          font-size: clamp(1rem, 1.5vw, 1.25rem);
          color: rgba(255,255,255,0.6);
          margin-bottom: 3rem;
          line-height: 1.8;
          max-width: 640px;
        }
        /* Stats */
        .hero-stats {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }
        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .stat-number {
          font-size: clamp(2rem, 3.5vw, 3rem);
          font-weight: 900;
          color: #fff;
          letter-spacing: -1px;
          line-height: 1;
        }
        .stat-label {
          font-size: clamp(0.65rem, 0.9vw, 0.8rem);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: rgba(255,255,255,0.4);
          font-weight: 600;
        }
        .stat-divider {
          width: 1px;
          height: 40px;
          background: rgba(255,255,255,0.1);
        }
        /* CTAs */
        .hero-cta {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
        }
        .btn-hero-primary {
          background: var(--brand-primary);
          color: #000;
          padding: 1rem 2.5rem;
          border-radius: 4px;
          font-weight: 800;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(212,255,0,0.3);
        }
        .btn-hero-primary:hover {
          background: #fff;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(212,255,0,0.4);
        }
        .btn-hero-secondary {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: rgba(255,255,255,0.8);
          padding: 1rem 1.8rem;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.15);
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          transition: all 0.3s;
        }
        .btn-hero-secondary:hover {
          border-color: var(--brand-primary);
          color: var(--brand-primary);
          background: rgba(212,255,0,0.05);
        }
        /* Garantías */
        .hero-guarantees {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .guarantee-item {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: rgba(255,255,255,0.35);
          font-weight: 600;
        }
        .guarantee-dot {
          color: var(--brand-primary);
          font-size: 1rem;
        }
        @media (max-width: 768px) {
          .hero {
            padding: 8rem 1.5rem 4rem;
            align-items: flex-end;
            min-height: 100svh;
          }
          .hero-overlay {
            background: linear-gradient(
              180deg,
              rgba(5,5,5,0.3) 0%,
              rgba(5,5,5,0.98) 60%
            );
          }
          .hero-title { letter-spacing: -1px; }
          .stat-divider { display: none; }
          .hero-stats { gap: 1.5rem; }
          .btn-hero-primary, .btn-hero-secondary { width: 100%; justify-content: center; }
          .hero-guarantees { justify-content: center; }
          .slogan-block { justify-content: center; }
          .hero-content { max-width: 100%; }
        }
      `}</style>
    </section>
  );
}
