import React from "react";

import {
  Sheet as SheetPrimitive,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

type Props = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  side?: "left" | "right";
};

const Sheet = ({ trigger, children, className, side }: Props) => {
  return (
    <SheetPrimitive>
      <SheetTrigger className={className}>{trigger}</SheetTrigger>
      <SheetContent side={side} className="p-0">
        {children}
      </SheetContent>
    </SheetPrimitive>
  );
};

export default Sheet;
