import React from 'react';

const clients = [
  "Club Deportivo Atlas",
  "Academia Los Halcones",
  "Real Madrid City Campus",
  "FC Juventus Academy",
  "Escuela de Fútbol Millonarios",
  "Independiente del Valle Juvenil",
  "Boca Juniors Escuela",
  "Club Formativo La Cantera"
];

export default function ClientBanner() {
  return (
    <div className="client-banner">
      <div className="marquee-container">
        <div className="marquee-content">
          {/* Duplicamos la lista para crear el efecto infinito */}
          {[...clients, ...clients].map((client, index) => (
            <span key={index} className="client-name">
              {client}
              <span className="separator">•</span>
            </span>
          ))}
        </div>
      </div>
      <style>{`
        .client-banner {
          background-color: var(--brand-primary);
          color: var(--background);
          padding: 1rem 0;
          overflow: hidden;
          position: relative;
          border-top: 2px solid var(--background);
          border-bottom: 2px solid var(--background);
        }
        .marquee-container {
          display: flex;
          white-space: nowrap;
          overflow: hidden;
        }
        .marquee-content {
          display: flex;
          animation: marquee 30s linear infinite;
        }
        .client-name {
          font-weight: 900;
          font-size: 1.5rem;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          padding: 0 2rem;
        }
        .separator {
          margin-left: 4rem;
          color: rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}
