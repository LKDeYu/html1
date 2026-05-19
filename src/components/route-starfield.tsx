"use client";

import { usePathname } from "next/navigation";
import { StarfieldCanvas } from "@/components/starfield-canvas";

export function RouteStarfield() {
  const pathname = usePathname();

  if (pathname !== "/") {
    return null;
  }

  return <StarfieldCanvas />;
}
