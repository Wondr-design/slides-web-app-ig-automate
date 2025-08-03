"use client";

// Update the import path if the alias "@" is not configured or incorrect
import { usePaths } from "@/hooks/use-nav";
import React from "react";

type Props = {
  slug: string;
};

const InfoBar = ({ slug }: Props) => {
  const { page } = usePaths();

  return <div>Infobar</div>;
};

export default InfoBar;
