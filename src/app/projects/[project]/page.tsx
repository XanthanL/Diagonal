import { Metadata } from "next";
import { notFound } from "next/navigation";
import { archiveData } from "@/lib/data";
import { getAbsoluteUrl } from "@/lib/path";
import { ProjectOverviewClient } from "@/components/ProjectOverviewClient";
import {
  PROJECT_SLUGS,
  PROJECT_TITLES,
  PROJECT_STATEMENTS,
  groupBySeries,
  type ProjectSlug,
} from "@/lib/projects";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return PROJECT_SLUGS.map((slug) => ({ project: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { project: string };
}): Promise<Metadata> {
  const slug = params.project as ProjectSlug;
  const titles = PROJECT_TITLES[slug];
  if (!titles) {
    return { title: "Project | DIAGONAL" };
  }

  const title = `${titles.zh} / ${titles.en} | DIAGONAL`;
  const description = PROJECT_STATEMENTS[slug]?.zh || titles.zh;
  const url = getAbsoluteUrl(`/projects/${slug}`);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "DIAGONAL",
      locale: "zh_CN",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    other: {
      "itemprop:name": title,
      "itemprop:description": description,
    },
  };
}

export default async function ProjectOverviewPage({
  params,
}: {
  params: { project: string };
}) {
  const slug = params.project as ProjectSlug;

  if (!PROJECT_TITLES[slug]) {
    return notFound();
  }

  const projectItems = archiveData.filter((item) => item.project === slug);
  const groups = groupBySeries(projectItems);

  return <ProjectOverviewClient project={slug} groups={groups} />;
}
