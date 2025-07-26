import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="py-8 mt-20 border-t-4 border-stone-800">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-sm text-stone-500">
          &copy; {new Date().getFullYear()} InstaFlow. All Rights Reserved.
        </p>
        <div className="flex gap-6 text-sm font-bold">
          <a href="#" className="hover:underline">
            TERMS
          </a>
          <a href="#" className="hover:underline">
            PRIVACY
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
