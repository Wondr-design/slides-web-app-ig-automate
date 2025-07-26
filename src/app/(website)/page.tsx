import Features from "../../components/layouts/Features";
import Footer from "../../components/layouts/Footer";
import Header from "../../components/layouts/Header";
import Hero from "../../components/layouts/Hero";
import Marquee from "../../components/layouts/Marquee";
import Pricing from "../../components/layouts/Pricing";

export default function Home() {
  return (
    <div className="bg-zinc-950 text-stone-300 min-h-screen font-sans antialiased overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header />
        <main>
          <Hero />
          <Marquee />
          <Features />
          <Pricing />
        </main>
        <Footer />
      </div>
    </div>
  );
}
