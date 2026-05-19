import { redirect } from "next/navigation";

type WritePostPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function WritePostPage({ params }: WritePostPageProps) {
  const { slug } = await params;
  redirect(`/blog/${slug}`);
}
