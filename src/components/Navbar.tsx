import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <a href="/" className="logo-link" aria-label="Uniformes Master Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Uniformes Master Logo" className="brand-logo" />
        </a>
        <div className="navbar-links">
          <a href="#" className="nav-item">Inicio</a>
          <a href="#catalogo" className="nav-item">Catálogo</a>
          <a href="#" className="nav-item">Clientes</a>
          <a href="https://wa.me/573012815448" target="_blank" rel="noopener noreferrer" className="btn-primary">
            Cotizar
          </a>
        </div>
      </div>
      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(9, 9, 11, 0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 50;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand-logo {
          height: 60px;
          width: auto;
          object-fit: contain;
        }
        .navbar-links {
          display: flex;
          align-items: center;
          gap: 2.5rem;
        }
        .nav-item {
          font-weight: 600;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .nav-item:hover {
          color: var(--brand-primary);
        }
        @media (max-width: 768px) {
          .nav-item {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}
