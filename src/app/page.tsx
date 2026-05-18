import { PortfolioExperience } from "@/components/portfolio-experience";
import { StarfieldCanvas } from "@/components/starfield-canvas";
import { listProjects, listSkills } from "@/lib/cms-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function Home() {
  const projects = listProjects();
  const skills = listSkills();

  return (
    <>
      <StarfieldCanvas />
      <PortfolioExperience projects={projects} skills={skills} />
    </>
  );
}
