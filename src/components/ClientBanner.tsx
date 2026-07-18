import React from 'react';

const clients = [
  "Club Deportivo Atlas",
  "Academia Los Halcones",
  "FC Millonarios Escuela",
  "Independiente del Valle",
  "Club Formativo La Cantera",
  "Liga Deportiva Municipal",
  "Selección Departamental Sub-17",
  "Escuela de Fútbol Real",
];

export default function ClientBanner() {
  return (
    <div className="client-banner">
      <div className="marquee-container">
        <div className="marquee-content">
          {[...clients, ...clients].map((client, index) => (
            <span key={index} className="client-name">
              {client}
              <span className="separator" aria-hidden="true">—</span>
            </span>
          ))}
        </div>
      </div>
      <style>{`
        .client-banner {
          background-color: var(--brand-primary);
          color: #000;
          padding: 0.9rem 0;
          overflow: hidden;
          position: relative;
        }
        .client-banner::before,
        .client-banner::after {
          content: '';
          position: absolute;
          top: 0; bottom: 0;
          width: 80px;
          z-index: 2;
          pointer-events: none;
        }
        .client-banner::before {
          left: 0;
          background: linear-gradient(to right, var(--brand-primary), transparent);
        }
        .client-banner::after {
          right: 0;
          background: linear-gradient(to left, var(--brand-primary), transparent);
        }
        .marquee-container {
          display: flex;
          white-space: nowrap;
          overflow: hidden;
        }
        .marquee-content {
          display: flex;
          animation: marquee 35s linear infinite;
        }
        .client-name {
          font-weight: 800;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          display: flex;
          align-items: center;
          padding: 0 2rem;
        }
        .separator {
          margin-left: 2rem;
          opacity: 0.3;
        }
      `}</style>
    </div>
  );
}
