import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { getWorkBySlug, themeToCssVars, WORKS } from "@/lib/works";
import { HearcatMock } from "@/components/mocks/HearcatMock";
import { QiitaMock } from "@/components/mocks/QiitaMock";
import { TermMock } from "@/components/mocks/TermMock";
import { SiteMock } from "@/components/mocks/SiteMock";
import { ReplayOpeningButton } from "@/components/ReplayOpeningButton";
import { BackToWorksLink } from "@/components/BackToWorksLink";

const MOCK_COMPONENTS = {
  hearcat: HearcatMock,
  qiita: QiitaMock,
  term: TermMock,
  site: SiteMock,
} as const;

type WorkPageParams = { slug: string };

export function generateStaticParams(): WorkPageParams[] {
  return WORKS.map((work) => ({ slug: work.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<WorkPageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const work = getWorkBySlug(slug);
  if (!work) return {};
  return {
    title: `${work.title} — Yutaro Nakayama`,
    description: work.lede,
  };
}

export default async function WorkDetailPage({ params }: { params: Promise<WorkPageParams> }) {
  const { slug } = await params;
  const work = getWorkBySlug(slug);
  if (!work) notFound();

  const Mock = MOCK_COMPONENTS[work.mock];

  return (
    <section
      className="work-detail"
      style={{ backgroundColor: work.theme.bg, color: work.theme.ink, ...themeToCssVars(work.theme) }}
    >
      <div className="work-detail-inner">
        <BackToWorksLink className="work-detail-back">← works へ戻る</BackToWorksLink>
        <ViewTransition name={`work-${work.slug}`}>
          <div className="work-detail-visual">
            <Mock />
          </div>
        </ViewTransition>
        <p className="work-detail-tag">
          <b>{work.num}</b> — {work.tag}
        </p>
        <ViewTransition name={`work-title-${work.slug}`}>
          <h1 className="work-detail-title">{work.title}</h1>
        </ViewTransition>
        <p className="work-detail-lede">{work.lede}</p>
        <div className="work-detail-body">
          {work.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        {work.externalUrl && work.externalLabel ? (
          <a className="work-detail-cta" href={work.externalUrl} target="_blank" rel="noopener">
            {work.externalLabel}
          </a>
        ) : (
          <ReplayOpeningButton className="work-detail-cta">オープニングをもう一度</ReplayOpeningButton>
        )}
      </div>
    </section>
  );
}
