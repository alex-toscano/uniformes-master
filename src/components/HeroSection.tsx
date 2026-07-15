export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-overlay"></div>
      <div className="hero-content animate-fade-in">
        <h1 className="hero-title">
          EL UNIFORME DE <br />
          <span className="text-primary">LOS QUE GANAN.</span>
        </h1>
        <p className="hero-subtitle">
          Vistiendo campeones con diseño personalizado, materiales premium y la identidad que tu equipo merece.
        </p>
        <div className="hero-features">
          <div className="feature">
            <span className="icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </span>
            <p>Diseño<br/>Agresivo</p>
          </div>
          <div className="feature">
            <span className="icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </span>
            <p>Materiales<br/>Premium</p>
          </div>
          <div className="feature">
            <span className="icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
            </span>
            <p>Calidad<br/>Campeón</p>
          </div>
          <div className="feature">
            <span className="icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            </span>
            <p>Envíos a<br/>toda Colombia</p>
          </div>
        </div>
        <div className="hero-cta">
          <a href="https://wa.me/573012815448" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
            Cotiza Ahora
          </a>
          <p className="min-order">Somos fabricantes desde 10 unidades</p>
        </div>
      </div>
      <style>{`
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 8rem 2rem 4rem;
          background-color: var(--brand-secondary);
          background-image: url('/hero-bg.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          overflow: hidden;
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(212, 255, 0, 0.1) 0%, rgba(10,10,10,0.8) 100%);
          z-index: 1;
        }
        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .hero-title {
          font-size: clamp(3rem, 6vw, 5rem);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          letter-spacing: -1px;
          color: #fff;
        }
        .text-primary {
          color: var(--brand-primary);
          text-shadow: 0 0 20px rgba(212, 255, 0, 0.3);
        }
        .hero-subtitle {
          font-size: 1.25rem;
          max-width: 600px;
          color: #d1d5db;
          margin-bottom: 3rem;
          line-height: 1.6;
        }
        .hero-features {
          display: flex;
          gap: 2rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }
        .feature {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.5rem;
          color: #9ca3af;
          font-size: 0.85rem;
          text-transform: uppercase;
          font-weight: 600;
        }
        .feature .icon {
          font-size: 1.5rem;
          width: 3rem;
          height: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--brand-primary);
          border-radius: 50%;
          color: var(--brand-primary);
        }
        .hero-cta {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: flex-start;
        }
        .min-order {
          color: var(--brand-primary);
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      `}</style>
    </section>
  );
}
