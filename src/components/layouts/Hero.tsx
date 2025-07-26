import React from "react";

const Hero: React.FC = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
        <div className="md:col-span-3">
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black leading-none">
            <span className="block">AUTOMATE YOUR</span>
            <span className="block">INSTAGRAM.</span>
          </h1>
          <p className="mt-6 text-base md:text-lg max-w-xl text-stone-400">
            Stop wasting time. Start automating your DMs, posts, and engagement.
            Get back to what matters. Direct, powerful, no-nonsense growth.
          </p>
          <a
            href="#pricing"
            className="mt-10 inline-block bg-stone-300 text-zinc-950 px-10 py-4 font-bold text-lg hover:bg-stone-400 transition-colors border-2 border-stone-300"
          >
            SEE PRICING
          </a>
        </div>
        <div className="md:col-span-2 hidden md:block">
          <div className="border-2 border-stone-700 border-dashed aspect-square w-full flex items-center justify-center p-4">
            <div className="text-center">
              <span className="font-display text-2xl">RAW POWER</span>
              <p className="text-sm text-stone-500 mt-2">NO GIMMICKS.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
