import { PortfolioExperience } from "@/components/portfolio-experience";
import { listProjects, listSkills } from "@/lib/cms-db";
import { listWriting } from "@/lib/writing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function Home() {
  const projects = listProjects();
  const skills = listSkills();
  const posts = listWriting();

  return <PortfolioExperience projects={projects} skills={skills} posts={posts} />;
}
