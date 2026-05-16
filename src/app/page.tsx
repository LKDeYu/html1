import { LiquidCanvas } from "@/components/liquid-canvas";
import { PortfolioExperience } from "@/components/portfolio-experience";
import { StarfieldCanvas } from "@/components/starfield-canvas";

export default function Home() {
  return (
    <>
      <LiquidCanvas />
      <StarfieldCanvas />
      <PortfolioExperience />
    </>
  );
}
