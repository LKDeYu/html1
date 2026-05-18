import { PortfolioExperience } from "@/components/portfolio-experience";
import { StarfieldCanvas } from "@/components/starfield-canvas";
import { listBlogPosts, listProjects, listSkills } from "@/lib/cms-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function Home() {
  const projects = listProjects();
  const skills = listSkills();
  const posts = listBlogPosts();

  return (
    <>
      <StarfieldCanvas />
      <PortfolioExperience projects={projects} skills={skills} posts={posts} />
    </>
  );
}
