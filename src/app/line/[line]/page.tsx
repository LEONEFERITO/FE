import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ProductCard } from "@/components/product/ProductCard";
import { BackButton } from "@/components/ui/BackButton";
import { LINE_INTRO } from "@/data/brand";
import { getCatalog } from "@/lib/catalog";
import { getSiteImages, lineSlots } from "@/lib/siteImages";
import { shareMetadata } from "@/lib/metadata";
import { CATEGORY_LABEL, LINE_LABEL, type Category, type ProductLine } from "@/types/product";

/**
 * 라인 페이지 — 레오네 · 페리토 (2026-10-05 고객 디자인 가이드 → 2026-10-17 디자이너 수정본).
 *
 * 메인의 두 라인 카드를 누르면 온다. 구성:
 *   1 머리      뒤로 가기(왼쪽 위) · 작은 라벨(CLASSIC LINE / ATHLETIC LINE) · 라인 이름 · 한 줄 제목 · 소개 세 줄
 *   2 다섯 칸   사진 다섯 장 — 시안 크기 287×392, 사이 10px
 *   3 상품      분류별로 쭉 — 수트 · 셔츠 · 팬츠 · 자켓 순. 분류 이름은 영문(SHIRT · TROUSERS …)
 *
 * ── 2026-10-17 디자이너 피그마 댓글로 바뀐 것 ───────────────
 * 페이지 전체가 검정이다("흰 부분 블랙으로") — 전에는 다섯 칸까지만 검정이고 상품은 크림이었다.
 * GNB 는 와인(#5E1F21, Header tone="wine"), 라인 이름 글자색도 #5E1F21(시안의 "레오네 텍스트 색상").
 * TODO(고객확인) #5E1F21 은 검정 위에서 1.7:1 — 디자이너가 지정한 값이라 그대로 두되, 확인되면 밝은 색으로.
 * 소개 문안은 디자이너가 적어 준 원문(data/brand.ts LINE_INTRO) — "확인 중" 자리 표시는 끝났다.
 * 뺀 것: 분류 위 눈썹 선, 다섯 칸 아래 "페인포인트와 니즈 포인트", 맨 아래 선 + "다른 라인 보기" 버튼.
 *
 * 다섯 칸의 사진은 관리자가 올린다(/admin/display/line — 서버 site_image LINE_*_1~5, V22). 비운 칸은 그 라인
 * 상품의 사진을 앞에서부터 채우고, 모자라면 시안의 회색 칸으로 남는다.
 */

const LINE_BY_SLUG: Record<string, ProductLine> = { leone: "LEONE", ferito: "FERITO" };

/** 가이드가 적은 순서(수트 · 셔츠 · 팬츠 · 자켓) 뒤에 나머지 분류를 잇는다. */
const CATEGORY_ORDER: Category[] = ["SUIT", "SHIRT", "TROUSERS", "JACKET", "SHOES", "ACCESSORIES"];

const TILE_COUNT = 5;

export function generateStaticParams() {
  return Object.keys(LINE_BY_SLUG).map((line) => ({ line }));
}

export async function generateMetadata({ params }: PageProps<"/line/[line]">): Promise<Metadata> {
  const { line } = await params;
  const key = LINE_BY_SLUG[line];
  if (!key) return {};
  const label = LINE_LABEL[key];
  return shareMetadata({
    title: `${label.en} · ${label.ko}`,
    description: `${label.kind} 라인. ${LINE_INTRO[key].tagline}`,
  });
}

export default async function LinePage({ params }: PageProps<"/line/[line]">) {
  const { line } = await params;
  const key = LINE_BY_SLUG[line];
  if (!key) notFound();

  const label = LINE_LABEL[key];
  const intro = LINE_INTRO[key];
  const products = (await getCatalog()).filter((p) => p.line === key);
  // 다섯 칸: 관리자가 올린 사진(/admin/display/line, V22) 먼저, 빈 칸은 그 라인 상품 사진으로, 그것도 없으면 회색 칸
  const slots = lineSlots(await getSiteImages(), key);
  const fallback = products.flatMap((p) => p.images);
  let used = 0;
  const photos = slots.map((s) => s ?? fallback[used++] ?? null);
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: products.filter((p) => p.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <Header tone="wine" />

      {/* 페이지 전체가 검정 — on-black 이 글자 · 선 토큰을 검정 위 값으로 맞춘다(globals.css) */}
      <main id="main" className="on-black flex-1">
        {/* ── 1 머리 + 2 다섯 칸 ── */}
        <section aria-labelledby="line-heading">
          {/* 뒤로 가기 — 헤더 바로 아래 왼쪽 끝(시안의 화살표 자리). 헤더와 같은 옆 여백 */}
          <div className="px-3 pt-4 md:px-8 md:pt-6">
            <BackButton />
          </div>

          <div className="mx-auto max-w-[1320px] px-5 pb-12 text-center md:px-15 md:pb-16">
            {/* 작은 라벨 — 시안: 라인 이름과 같은 글꼴, 굵게, 10px 대문자 */}
            <p className="font-display text-primary text-[10px] uppercase tracking-[0.2em]">{intro.label}</p>
            <h1
              id="line-heading"
              className="font-display leading-display tracking-display mt-3 text-3xl text-[#5E1F21] md:text-4xl"
            >
              {label.en}
            </h1>
            {/* 한 줄 제목 14px 굵게, 소개 14px 가늘게 · 행간 25px (시안 수치) */}
            <p className="font-display text-primary mt-12 text-[14px] leading-none md:mt-16">{intro.tagline}</p>
            <p className="text-primary mt-3 text-[14px] font-light leading-[25px]">
              {intro.body.map((sentence) => (
                <span key={sentence} className="md:block">
                  {sentence}{" "}
                </span>
              ))}
            </p>
          </div>

          {/*
            다섯 칸 — 시안 287×392(≈3:4), 사이 10px. 1515px 이상에서 칸이 정확히 287 이고 그 아래는 폭에 맞춰 준다.
            넓은 화면에서 한 줄 다섯, 좁은 화면은 2열(다섯째 칸은 가운데 줄 아래로 간다).
          */}
          <div className="mx-auto max-w-[1515px] px-5 pb-16 md:pb-24">
            <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
              {Array.from({ length: TILE_COUNT }, (_, i) => {
                const photo = photos[i];
                // 좁은 화면의 다섯째 칸: 두 칸을 차지하고 그 안에서 가운데 — 폭은 안쪽 figure 가 맡는다(li 에 w-auto 를 주면 grid 안에서 0 이 된다)
                return (
                  <li key={i} className={i === 4 ? "col-span-2 flex justify-center md:col-span-1 md:block" : undefined}>
                    {/* 사진이 없으면 시안의 회색 칸 그대로 */}
                    <figure className={`relative aspect-[287/392] overflow-hidden bg-[#D9D9D9] ${i === 4 ? "w-[calc(50%-0.3125rem)] md:w-auto" : ""}`}>
                      {photo && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={photo.url} alt={photo.alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top" />
                      )}
                    </figure>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ── 3 상품 — 분류별로 쭉, 검정 위에 ── */}
        <div className="mx-auto max-w-[1320px] px-5 pb-24 md:px-15 md:pb-32">
          {groups.length > 0 ? (
            <div className="flex flex-col gap-20">
              {groups.map(({ category, items }) => (
                <section key={category} aria-labelledby={`line-${category}`}>
                  {/* 분류 이름은 영문 하나 — 눈썹 선 · 한글 이름은 뺐다 (2026-10-17) */}
                  <h2
                    id={`line-${category}`}
                    className="font-display text-primary leading-display tracking-display text-3xl"
                  >
                    {CATEGORY_LABEL[category].en}
                  </h2>
                  <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
                    {items.map((p) => (
                      <li key={p.slug}>
                        <ProductCard product={p} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 py-16 text-center">
              <h2 className="text-secondary text-sm font-normal">{label.ko}의 상품을 준비하고 있습니다.</h2>
              <Link
                href="/products/"
                className="border-interactive text-accent hover:border-accent hover:bg-accent-tint ease-fluid tracking-button inline-flex min-h-11 items-center rounded-full border px-6 text-xs transition-all duration-500"
              >
                전체 제품 보기
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
