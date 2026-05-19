import { PortfolioExperience } from "@/components/portfolio-experience";
import { listBlogPosts, listProjects, listSkills } from "@/lib/cms-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function Home() {
  const projects = listProjects();
  const skills = listSkills();
  const posts = listBlogPosts();

  return <PortfolioExperience projects={projects} skills={skills} posts={posts} />;
}
