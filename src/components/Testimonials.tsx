import React from 'react';

const testimonials = [
  {
    name: "Carlos Martínez",
    role: "Director Deportivo, Halcones FC",
    text: "Desde que cambiamos a Uniformes Master, la actitud de los chicos cambió. Sentirse como profesionales los hace jugar como profesionales.",
  },
  {
    name: "Andrés Silva",
    role: "Presidente, Academia Élite",
    text: "La calidad de la tela y la viveza de los colores superaron nuestras expectativas. Definitivamente el uniforme de los que ganan.",
  },
  {
    name: "Julián Rojas",
    role: "Entrenador, Real Bogotá",
    text: "El diseño personalizado nos dio una identidad única en la liga. El servicio y los acabados son incomparables.",
  }
];

export default function Testimonials() {
  return (
    <section className="testimonials">
      <div className="testimonials-container">
        <h2 className="section-title text-center">LO QUE DICEN <span className="text-primary">LOS CAMPEONES</span></h2>
        <div className="cards-grid">
          {testimonials.map((t, idx) => (
            <div key={idx} className="testimonial-card">
              <p className="quote">"{t.text}"</p>
              <div className="author">
                <div className="avatar"></div>
                <div className="author-info">
                  <h4>{t.name}</h4>
                  <span>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .testimonials {
          padding: 6rem 2rem;
          background: linear-gradient(180deg, var(--background) 0%, var(--surface) 100%);
        }
        .testimonials-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .text-center {
          text-align: center;
          margin-bottom: 4rem;
        }
        .section-title {
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-weight: 900;
          text-transform: uppercase;
        }
        .text-primary {
          color: var(--brand-primary);
        }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
        .testimonial-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          padding: 2rem;
          border-radius: var(--radius);
          backdrop-filter: blur(10px);
          transition: transform 0.3s ease, border-color 0.3s ease;
        }
        .testimonial-card:hover {
          transform: translateY(-10px);
          border-color: var(--brand-primary);
          animation: pulse-glow 2s infinite;
        }
        .quote {
          font-size: 1.1rem;
          line-height: 1.6;
          color: #d1d5db;
          margin-bottom: 2rem;
          font-style: italic;
        }
        .author {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: var(--brand-primary);
          opacity: 0.8;
        }
        .author-info h4 {
          margin: 0;
          color: #fff;
          font-weight: 700;
        }
        .author-info span {
          font-size: 0.85rem;
          color: var(--brand-primary);
          text-transform: uppercase;
          font-weight: 600;
        }
      `}</style>
    </section>
  );
}
