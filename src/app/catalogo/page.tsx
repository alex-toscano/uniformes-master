import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import CatalogGrid from '@/components/CatalogGrid';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';

export const metadata: Metadata = {
  title: 'Catálogo de Uniformes | Uniformes Master',
  description: 'Explora más de 100 diseños exclusivos de uniformes deportivos. Filtra por colección y solicita tu cotización personalizada.',
};

export default function CatalogoPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Page header */}
        <div className="catalog-page-header">
          <div className="catalog-page-inner">
            <div className="slogan-block">
              <div className="sl"></div>
              <p className="sl-text">Colecciones 2025</p>
              <div className="sl"></div>
            </div>
            <h1 className="catalog-page-title">
              CATÁLOGO DE<br />
              <span className="accent">UNIFORMES.</span>
            </h1>
            <p className="catalog-page-sub">
              Más de 100 diseños exclusivos. Selecciona el que más le guste a tu equipo y solicita tu cotización.
            </p>
          </div>
        </div>

        <CatalogGrid />
      </main>
      <Footer />
      <FloatingWhatsApp />

      <style>{`
        .catalog-page-header {
          padding: 10rem 2rem 3rem;
          background: #050505;
          text-align: center;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .catalog-page-inner {
          max-width: 720px;
          margin: 0 auto;
        }
        .slogan-block {
          display: inline-flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .sl {
          width: 30px;
          height: 1px;
          background: var(--brand-primary);
        }
        .sl-text {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.35em;
          color: var(--brand-primary);
          text-transform: uppercase;
        }
        .catalog-page-title {
          font-size: clamp(3rem, 7vw, 5.5rem);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -2px;
          color: #fff;
          line-height: 1.05;
          margin-bottom: 1.5rem;
        }
        .accent { color: var(--brand-primary); }
        .catalog-page-sub {
          font-size: 1.1rem;
          color: rgba(255,255,255,0.4);
          line-height: 1.7;
          max-width: 500px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .catalog-page-header { padding: 8rem 1.5rem 3rem; }
          .catalog-page-title { letter-spacing: -1px; }
        }
      `}</style>
    </>
  );
}
