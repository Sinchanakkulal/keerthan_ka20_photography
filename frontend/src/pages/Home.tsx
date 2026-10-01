import { useLenis } from "@/lib/smoothScroll";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { About } from "@/components/About";
import { Services } from "@/components/Services";
import { Gallery } from "@/components/Gallery";
import { Reviews } from "@/components/Reviews";
import { Booking } from "@/components/Booking";
import { Contact } from "@/components/Contact";
import { InstaStrip } from "@/components/InstaStrip";
import { Footer } from "@/components/Footer";

export default function Home() {
  useLenis(true);
  return (
    <div id="top" className="relative min-h-screen bg-obsidian text-cream" data-testid="home-page">
      <div className="grain-overlay pointer-events-none fixed inset-0 z-[70] opacity-[0.05] mix-blend-overlay" />
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <About />
        <Services />
        <Gallery />
        <Reviews />
        <Booking />
        <Contact />
        <InstaStrip />
      </main>
      <Footer />
    </div>
  );
}
