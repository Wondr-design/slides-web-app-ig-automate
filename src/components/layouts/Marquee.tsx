import React from "react";

const Marquee: React.FC = () => {
  const marqueeContent = Array(6)
    .fill(null)
    .map((_, i) => (
      <React.Fragment key={i}>
        <span className="font-display text-xl md:text-2xl">SAVE TIME</span>
        <span className="mx-4 text-stone-700">&bull;</span>
        <span className="font-display text-xl md:text-2xl">GAIN FOLLOWERS</span>
        <span className="mx-4 text-stone-700">&bull;</span>
        <span className="font-display text-xl md:text-2xl">AUTOMATE DMs</span>
        <span className="mx-4 text-stone-700">&bull;</span>
      </React.Fragment>
    ));

  return (
    <section className="py-10 border-y-2 border-stone-800">
      <div className="relative flex overflow-x-hidden">
        <div className="py-2 whitespace-nowrap animate-marquee flex items-center">
          {marqueeContent}
        </div>
        <div className="absolute top-0 py-2 whitespace-nowrap animate-marquee flex items-center">
          {marqueeContent}
        </div>
      </div>
    </section>
  );
};

export default Marquee;
