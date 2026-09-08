import type { Metadata } from "next";
import { ProjectDetailView } from "@/components/projects/project-detail-view";

interface PageProps {
  params: Promise<{ workId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { workId } = await params;
  return { title: `Work ${decodeURIComponent(workId)}` };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { workId } = await params;
  return <ProjectDetailView workId={decodeURIComponent(workId)} />;
}
