export default function Footer() {
  return (
    <footer className="footer" id="contacto">
      <div className="footer-inner">

        {/* Top grid */}
        <div className="footer-grid">

          {/* Brand */}
          <div className="footer-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Uniformes Master" className="footer-logo" />
            <p className="footer-tagline">
              Fabricantes de uniformes deportivos premium. Vistiendo campeones desde 2020 en toda Colombia.
            </p>
            <div className="social-links">
              <a href="https://instagram.com/uniformesmaster1" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
                </svg>
              </a>
              <a href="https://facebook.com/uniformesmaster1" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                </svg>
              </a>
              <a href="https://wa.me/573012815448" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="WhatsApp">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Navegación</h4>
            <ul className="footer-links">
              <li><a href="/">Inicio</a></li>
              <li><a href="#catalogo">Catálogo</a></li>
              <li><a href="#testimonios">Clientes</a></li>
              <li><a href="#contacto">Contacto</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4 className="footer-heading">Contacto</h4>
            <ul className="footer-links">
              <li>
                <a href="https://wa.me/573012815448" target="_blank" rel="noopener noreferrer">
                  +57 301 281 5448
                </a>
              </li>
              <li><span>Envíos a toda Colombia</span></li>
              <li><span>Entrega en 7-15 días hábiles</span></li>
              <li><span>Desde 10 unidades</span></li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="footer-divider"></div>

        {/* Bottom */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Uniformes Master · Todos los derechos reservados.</p>
          <p className="footer-credit">Desarrollado por <a href="#" target="_blank" rel="noopener noreferrer">AT Web Solutions</a></p>
        </div>
      </div>

      <style>{`
        .footer {
          background: #030303;
          border-top: 1px solid rgba(255,255,255,0.04);
          padding: 5rem 2rem 2rem;
        }
        .footer-inner {
          max-width: 1280px;
          margin: 0 auto;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 4rem;
          margin-bottom: 4rem;
        }
        .footer-logo {
          height: 90px;
          width: auto;
          object-fit: contain;
          margin-bottom: 1.5rem;
          filter: invert(1);
          mix-blend-mode: screen;
          transform: scale(1.6);
          transform-origin: left center;
        }
        .footer-tagline {
          color: rgba(255,255,255,0.35);
          font-size: 0.9rem;
          line-height: 1.7;
          margin-bottom: 1.5rem;
          max-width: 300px;
        }
        .social-links {
          display: flex;
          gap: 0.75rem;
        }
        .social-link {
          width: 38px;
          height: 38px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.4);
          transition: all 0.3s;
        }
        .social-link:hover {
          border-color: var(--brand-primary);
          color: var(--brand-primary);
          background: rgba(212,255,0,0.05);
        }
        .footer-col {}
        .footer-heading {
          color: #fff;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 1.5rem;
        }
        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .footer-links a, .footer-links span {
          color: rgba(255,255,255,0.35);
          font-size: 0.9rem;
          transition: color 0.3s;
          cursor: default;
        }
        .footer-links a {
          cursor: pointer;
        }
        .footer-links a:hover {
          color: var(--brand-primary);
        }
        .footer-divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
          margin-bottom: 2rem;
        }
        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.2);
          flex-wrap: wrap;
          gap: 1rem;
        }
        .footer-credit a {
          color: rgba(255,255,255,0.3);
          transition: color 0.3s;
        }
        .footer-credit a:hover { color: var(--brand-primary); }
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
          }
          .footer-brand { grid-column: 1 / -1; }
        }
        @media (max-width: 600px) {
          .footer { padding: 4rem 1.5rem 2rem; }
          .footer-grid { grid-template-columns: 1fr; gap: 2.5rem; }
          .footer-brand { grid-column: 1; }
          .footer-bottom { flex-direction: column; text-align: center; }
        }
      `}</style>
    </footer>
  );
}
