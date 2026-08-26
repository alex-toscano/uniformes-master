import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ClientBanner from '@/components/ClientBanner';
import CatalogPreview from '@/components/CatalogPreview';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
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
        <FAQ />
        <Testimonials />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
