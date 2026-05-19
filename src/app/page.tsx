import { PortfolioExperience } from "@/components/portfolio-experience";
import { listProjects, listSkills } from "@/lib/portfolio-data";
import { listWriting } from "@/lib/writing";

export default function Home() {
  const projects = listProjects();
  const skills = listSkills();
  const posts = listWriting();

  return <PortfolioExperience projects={projects} skills={skills} posts={posts} />;
}
