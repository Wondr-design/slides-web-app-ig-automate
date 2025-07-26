import React from "react";

const PricingCard: React.FC<{
  plan: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}> = ({ plan, price, description, features, highlighted }) => (
  <div
    className={`border-2 p-8 flex flex-col ${
      highlighted
        ? "bg-stone-300 text-zinc-950 border-stone-300"
        : "border-stone-800"
    }`}
  >
    <h3 className="font-display text-2xl font-black">{plan}</h3>
    <p className={`mt-2 ${highlighted ? "text-zinc-700" : "text-stone-400"}`}>
      {description}
    </p>
    <div className="mt-6">
      <span className="font-display text-5xl font-black">${price}</span>
      <span
        className={`ml-1 ${highlighted ? "text-zinc-700" : "text-stone-500"}`}
      >
        /month
      </span>
    </div>
    <ul className="mt-8 space-y-4 flex-grow">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start">
          <svg
            className={`h-6 w-6 mr-3 flex-shrink-0 ${
              highlighted ? "text-zinc-950" : "text-stone-300"
            }`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <a
      href="#"
      className={`mt-10 block w-full text-center py-4 font-bold border-2 ${
        highlighted
          ? "bg-zinc-950 text-stone-300 border-zinc-950 hover:bg-zinc-800"
          : "bg-stone-300 text-zinc-950 border-stone-300 hover:bg-stone-400"
      }`}
    >
      CHOOSE PLAN
    </a>
  </div>
);

const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-20 border-t-2 border-stone-800">
      <div className="text-center">
        <h2 className="font-display text-5xl font-black">PRICING.</h2>
        <p className="mt-4 text-lg text-stone-400">
          Straightforward plans. No hidden fees.
        </p>
      </div>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <PricingCard
          plan="STARTER"
          price="29"
          description="For individuals getting started."
          features={[
            "DM Automation",
            "Post Scheduling",
            "Basic Analytics",
            "Email Support",
          ]}
        />
        <PricingCard
          plan="PRO"
          price="79"
          description="For professionals and businesses."
          features={[
            "Everything in Starter",
            "Advanced Analytics",
            "Welcome Sequences",
            "Priority Support",
          ]}
          highlighted
        />
        <PricingCard
          plan="AGENCY"
          price="149"
          description="For agencies managing multiple clients."
          features={[
            "Everything in Pro",
            "Manage 5 Accounts",
            "Team Members",
            "Dedicated Account Manager",
          ]}
        />
      </div>
    </section>
  );
};

export default Pricing;
