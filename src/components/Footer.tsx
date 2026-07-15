export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Uniformes Master Logo" className="footer-logo" />
          <p>Uniformes deportivos de alta calidad que representan la identidad de tu equipo en la cancha.</p>
        </div>
        <div className="footer-links">
          <h3>Enlaces Rápidos</h3>
          <ul>
            <li><a href="/">Inicio</a></li>
            <li><a href="/catalogo">Catálogo</a></li>
            <li><a href="/proceso">Nuestro Proceso</a></li>
          </ul>
        </div>
        <div className="footer-contact">
          <h3>Contacto</h3>
          <p>📞 +57 301 281 5448</p>
          <p>📍 Envíos a toda Colombia</p>
          <div className="social-links">
            <a href="https://instagram.com/uniformesmaster1" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://facebook.com/uniformesmaster1" target="_blank" rel="noopener noreferrer">Facebook</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Uniformes Master. Todos los derechos reservados.</p>
        <p>Desarrollado por AT Web Solutions</p>
      </div>
      <style>{`
        .footer {
          background-color: var(--brand-secondary);
          color: #d1d5db;
          padding: 4rem 2rem 1rem;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 3rem;
          margin-bottom: 3rem;
        }
        .footer-logo {
          height: 80px;
          width: auto;
          object-fit: contain;
          margin-bottom: 1rem;
        }
        .footer-links h3, .footer-contact h3 {
          color: #fff;
          margin-bottom: 1rem;
        }
        .footer-links ul {
          list-style: none;
        }
        .footer-links li {
          margin-bottom: 0.5rem;
        }
        .footer-links a:hover, .social-links a:hover {
          color: var(--brand-primary);
        }
        .footer-contact p {
          margin-bottom: 0.5rem;
        }
        .social-links {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        .social-links a {
          text-decoration: underline;
        }
        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding-top: 2rem;
          border-top: 1px solid #1a1a1a;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          color: #6b7280;
        }
        @media (max-width: 768px) {
          .footer-bottom {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }
        }
      `}</style>
    </footer>
  );
}
