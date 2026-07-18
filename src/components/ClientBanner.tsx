import React from 'react';

const benefits = [
  "ENVÍOS A TODA COLOMBIA",
  "CALIDAD PREMIUM",
  "FABRICACIÓN DESDE 6 UNIDADES",
  "DISEÑOS 100% PERSONALIZADOS",
  "TELAS ANTITRANSPIRANTES",
  "COSTURAS REFORZADAS",
  "ATENCIÓN PERSONALIZADA"
];

export default function ClientBanner() {
  return (
    <div className="client-banner">
      <div className="marquee-container">
        <div className="marquee-content">
          {[...benefits, ...benefits, ...benefits].map((benefit, index) => (
            <span key={index} className="client-name">
              {benefit}
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
          animation: marquee 40s linear infinite;
        }
        .client-name {
          font-weight: 800;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #000;
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
