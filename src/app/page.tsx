import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ClientBanner from '@/components/ClientBanner';
import CatalogPreview from '@/components/CatalogPreview';
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
        <CatalogPreview />
        <Testimonials />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
