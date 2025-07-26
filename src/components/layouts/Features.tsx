import React from "react";

// Using SVG as components for icons
const MessageIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-10"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

const GridIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-10"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);

// Defined helper component outside of the main component function
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}> = ({ icon, title, description, className }) => (
  <div className={`border-2 border-stone-800 p-8 flex flex-col ${className}`}>
    <div className="mb-6">{icon}</div>
    <h3 className="font-display text-4xl font-black">{title}</h3>
    <p className="mt-4 text-stone-400 flex-grow">{description}</p>
  </div>
);

const Features: React.FC = () => {
  return (
    <section className="py-20 border-t-2 border-stone-800">
      <div className="text-center">
        <h2 className="font-display text-5xl font-black">WHAT IT DOES.</h2>
        <p className="mt-4 text-lg text-stone-400">
          The core tools. Simple and effective.
        </p>
      </div>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-5 gap-8">
        <FeatureCard
          className="md:col-span-3"
          icon={<MessageIcon />}
          title="DM AUTOMATION"
          description="Automatically reply to messages, send welcome sequences, and manage your inbox. Set it up once and let it run. Spend less time typing, more time growing."
        />
        <FeatureCard
          className="md:col-span-2"
          icon={<GridIcon />}
          title="POST AUTOMATION"
          description="Schedule your posts and carousels for weeks in advance. We handle the publishing so you can focus on creating content, not on hitting 'Share' at the perfect time."
        />
      </div>
    </section>
  );
};

export default Features;
