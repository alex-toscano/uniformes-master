import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ClientBanner from '@/components/ClientBanner';
import CatalogGrid from '@/components/CatalogGrid';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ClientBanner />
        <CatalogGrid />
        <Testimonials />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
