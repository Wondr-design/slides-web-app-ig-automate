import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";

const Header: React.FC = () => {
  return (
    <header className="py-6 border-b-2 border-stone-800">
      <div className="flex justify-between items-center">
        <a href="#" className="font-display text-2xl md:text-3xl font-black">
          INSTAFLOW
        </a>
        <nav className="flex items-center gap-4 md:gap-6">
          <Button className="bg-stone-300 rounded-none text-zinc-950 px-5 py-2 md:px-6 md:py-3 text-sm md:text-base font-bold hover:bg-stone-400 transition-colors border-2 border-stone-300">
            <Link href="/dashboard">Login</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
