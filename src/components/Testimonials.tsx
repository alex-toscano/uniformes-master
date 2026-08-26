import React from 'react';

const testimonials = [
  {
    name: "Carlos Martínez",
    role: "Director Deportivo",
    club: "Halcones FC",
    text: "Desde que cambiamos a Uniformes Master, la actitud de los chicos cambió por completo. Sentirse como profesionales los hace jugar como profesionales.",
    stars: 5,
  },
  {
    name: "Andrés Silva",
    role: "Presidente",
    club: "Academia Élite",
    text: "La calidad de la tela y la viveza de los colores superaron nuestras expectativas. El acabado es de nivel internacional. Definitivamente no cambiamos.",
    stars: 5,
  },
  {
    name: "Julián Rojas",
    role: "Entrenador Principal",
    club: "Real Bogotá Sub-17",
    text: "El diseño personalizado nos dio una identidad única en la liga. El proceso fue rápido, el servicio impecable y la calidad es incomparable.",
    stars: 5,
  }
];

export default function Testimonials() {
  return (
    <section className="testimonials" id="testimonios">
      <div className="testimonials-container">

        {/* Header */}
        <div className="section-header">
          <div className="slogan-block">
            <div className="slogan-line"></div>
            <p className="slogan-text">Prueba Social</p>
            <div className="slogan-line"></div>
          </div>
          <h2 className="section-title">
            LO QUE DICEN <span className="text-primary">NUESTROS CLIENTES</span>
          </h2>
          <p className="section-subtitle">
            Más de 500 equipos en Colombia confían en nosotros para vestir a sus campeones.
          </p>
        </div>

        {/* Cards */}
        <div className="cards-grid">
          {testimonials.map((t, idx) => (
            <div key={idx} className="testimonial-card">
              <div className="stars">
                {Array.from({length: t.stars}).map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="var(--brand-primary)">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="quote">"{t.text}"</p>
              <div className="author">
                <div className="avatar">
                  <span>{t.name.charAt(0)}</span>
                </div>
                <div className="author-info">
                  <h4>{t.name}</h4>
                  <span>{t.role} · {t.club}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="testimonial-cta">
          <div className="cta-text">
            <h3>¿Listo para vestir a tu equipo como campeones?</h3>
            <p>Cotización sin compromiso en menos de 24 horas.</p>
          </div>
          <a
            href="https://wa.me/573012815448"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-btn"
          >
            Solicitar Cotización
          </a>
        </div>

      </div>
      <style>{`
        .testimonials {
          padding: 8rem 5vw;
          background: #050505;
          position: relative;
          overflow: hidden;
        }
        .testimonials::before {
          content: '';
          position: absolute;
          top: -200px; left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(212,255,0,0.04) 0%, transparent 70%);
          pointer-events: none;
        }
        .testimonials-container {
          max-width: 1600px;
          margin: 0 auto;
        }
        .section-header {
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
        .slogan-text {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.35em;
          color: var(--brand-primary);
          text-transform: uppercase;
        }
        .section-title {
          font-size: clamp(2rem, 5vw, 4rem);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -1px;
          color: #fff;
          margin-bottom: 1rem;
        }
        .text-primary { color: var(--brand-primary); }
        .section-subtitle {
          font-size: 1rem;
          color: rgba(255,255,255,0.4);
          max-width: 500px;
          margin: 0 auto;
          line-height: 1.7;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 4rem;
        }
        .testimonial-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 2.5rem;
          border-radius: 8px;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }
        .testimonial-card::before {
          content: '"';
          position: absolute;
          top: -10px; right: 20px;
          font-size: 8rem;
          color: rgba(212,255,0,0.04);
          font-family: Georgia, serif;
          line-height: 1;
          pointer-events: none;
        }
        .testimonial-card:hover {
          border-color: rgba(212,255,0,0.2);
          background: rgba(212,255,0,0.02);
          transform: translateY(-6px);
        }
        .stars {
          display: flex;
          gap: 3px;
          margin-bottom: 1.5rem;
        }
        .quote {
          font-size: 1rem;
          line-height: 1.75;
          color: rgba(255,255,255,0.65);
          margin-bottom: 2rem;
          font-style: italic;
        }
        .author {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(212,255,0,0.15);
          border: 1px solid rgba(212,255,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .avatar span {
          font-weight: 900;
          font-size: 1.1rem;
          color: var(--brand-primary);
        }
        .author-info h4 {
          color: #fff;
          font-weight: 700;
          font-size: 0.95rem;
          margin-bottom: 0.2rem;
        }
        .author-info span {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }
        /* CTA Banner */
        .testimonial-cta {
          background: rgba(212,255,0,0.06);
          border: 1px solid rgba(212,255,0,0.15);
          border-radius: 8px;
          padding: 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .cta-text h3 {
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 0.4rem;
          text-transform: uppercase;
          letter-spacing: -0.5px;
        }
        .cta-text p {
          color: rgba(255,255,255,0.4);
          font-size: 0.9rem;
        }
        .cta-btn {
          background: var(--brand-primary);
          color: #000;
          padding: 1rem 2.5rem;
          border-radius: 4px;
          font-weight: 800;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          white-space: nowrap;
          transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(212,255,0,0.25);
        }
        .cta-btn:hover {
          background: #fff;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(212,255,0,0.35);
        }
        @media (max-width: 768px) {
          .testimonials { padding: 5rem 1.5rem; }
          .testimonial-cta { flex-direction: column; text-align: center; }
          .cta-btn { width: 100%; text-align: center; }
        }
      `}</style>
    </section>
  );
}
