"use client";
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <a href="/" aria-label="Uniformes Master Home" className="brand-logo-wrapper">
            <img src="/logo.png" alt="Uniformes Master" className="brand-logo" />
          </a>

          <div className="navbar-links">
            <a href="/" className="nav-item">Inicio</a>
            <a href="/catalogo" className="nav-item">Catálogo</a>
            <a href="#testimonios" className="nav-item">Clientes</a>
            <a href="#faq" className="nav-item">FAQ</a>
            <a href="#contacto" className="nav-item">Contacto</a>
            <a
              href="https://wa.me/573012815448"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-cta"
            >
              Cotizar Ahora
            </a>
          </div>

          <button
            className="hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
          >
            <span className={menuOpen ? 'bar bar-open' : 'bar'}></span>
            <span className={menuOpen ? 'bar bar-open bar-mid' : 'bar bar-mid'}></span>
            <span className={menuOpen ? 'bar bar-open' : 'bar'}></span>
          </button>
        </div>

        {menuOpen && (
          <div className="mobile-menu">
            <a href="/catalogo" className="mobile-item" onClick={() => setMenuOpen(false)}>Catálogo</a>
            <a href="#testimonios" className="mobile-item" onClick={() => setMenuOpen(false)}>Clientes</a>
            <a href="#faq" className="mobile-item" onClick={() => setMenuOpen(false)}>FAQ</a>
            <a href="#contacto" className="mobile-item" onClick={() => setMenuOpen(false)}>Contacto</a>
            <a
              href="https://wa.me/573012815448"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-cta"
              onClick={() => setMenuOpen(false)}
            >
              Cotizar por WhatsApp
            </a>
          </div>
        )}
      </nav>

      <style>{`
        .navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          transition: all 0.4s ease;
          padding: 0;
        }
        .navbar-scrolled {
          background: rgba(5, 5, 5, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(212, 255, 0, 0.1);
          box-shadow: 0 4px 30px rgba(0,0,0,0.5);
        }
        .navbar-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 1.2rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand-logo-wrapper {
          height: 65px;
          overflow: hidden;
          display: flex;
          align-items: center;
        }
        .brand-logo {
          height: 120px; /* Altura ajustada para no recortar demasiado */
          width: auto;
          object-fit: contain;
          mix-blend-mode: screen;
        }
        .navbar-links {
          display: flex;
          align-items: center;
          gap: 2.5rem;
        }
        .nav-item {
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: rgba(255,255,255,0.7);
          transition: color 0.3s;
          position: relative;
        }
        .nav-item::after {
          content: '';
          position: absolute;
          bottom: -4px; left: 0; right: 0;
          height: 1px;
          background: var(--brand-primary);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }
        .nav-item:hover { color: #fff; }
        .nav-item:hover::after { transform: scaleX(1); }
        .nav-cta {
          background: var(--brand-primary);
          color: #000;
          padding: 0.65rem 1.5rem;
          border-radius: 4px;
          font-weight: 800;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          transition: all 0.3s;
        }
        .nav-cta:hover {
          background: #fff;
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(212,255,0,0.3);
        }
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 4px;
        }
        .bar {
          width: 24px;
          height: 2px;
          background: #fff;
          transition: all 0.3s;
          border-radius: 2px;
        }
        .bar-mid { width: 18px; }
        .bar-open { background: var(--brand-primary); }
        .mobile-menu {
          background: rgba(5,5,5,0.98);
          border-top: 1px solid rgba(212,255,0,0.1);
          padding: 1.5rem 2rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .mobile-item {
          padding: 1rem 0;
          font-size: 1.1rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: rgba(255,255,255,0.7);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: color 0.3s;
        }
        .mobile-item:hover { color: var(--brand-primary); }
        .mobile-cta {
          margin-top: 1.5rem;
          background: var(--brand-primary);
          color: #000;
          text-align: center;
          padding: 1rem;
          border-radius: 4px;
          font-weight: 800;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        @media (max-width: 768px) {
          .navbar-links { display: none; }
          .hamburger { display: flex; }
        }
      `}</style>
    </>
  );
}
