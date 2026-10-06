import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ProductCard } from "@/components/product/ProductCard";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getCatalog } from "@/lib/catalog";
import { getSiteImages, lineSlots } from "@/lib/siteImages";
import { shareMetadata } from "@/lib/metadata";
import { pendingLabel } from "@/lib/pending";
import { CATEGORY_LABEL, LINE_LABEL, type Category, type ProductLine } from "@/types/product";

/**
 * 라인 페이지 — 레오네 · 페리토 (2026-10-05 고객 디자인 가이드).
 *
 * 메인의 두 라인 카드를 누르면 온다. 가이드의 구성:
 *   1 머리      라인 이름 · "에슬레틱 라인" · 한 줄 설명 · **이 라인이 왜 존재하는지**(의도)
 *   2 다섯 칸   사진 다섯 장 — "페인포인트와 니즈 포인트"
 *   3 상품      "밑으로는 쭉 상품 나열, 각각 카테고리별로" — 수트 · 셔츠 · 팬츠 · 자켓 순
 *
 * ── 아직 없는 글 ─────────────────────────────────────────
 * 라인 이름 · 종류 · 한 줄 설명은 이미 받은 말이다(types/product.ts LINE_LABEL). 그런데 "어떤 의도로
 * 이 라인이 존재하는지" 와 다섯 칸의 페인포인트 · 니즈 문장은 가이드가 **자리만** 잡아 둔 것이다
 * ("설명 적어주고…"). 브랜드의 말을 우리가 지어 쓰지 않는다 — 검색 결과와 공유 미리보기에 그대로 나간다.
 * 그 자리는 "확인 중" 으로 드러내 둔다. TODO(고객확인) 라인별 의도 문안 · 페인포인트/니즈 다섯 문장 · 다섯 칸 사진.
 *
 * 다섯 칸의 사진은 관리자가 올린다(/admin/display/line — 서버 site_image LINE_*_1~5, V22). 비운 칸은 그 라인
 * 상품의 사진을 앞에서부터 채우고, 모자라면 가이드의 회색 칸으로 남는다.
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
    description: `${label.kind} 라인. ${label.description}`,
  });
}

export default async function LinePage({ params }: PageProps<"/line/[line]">) {
  const { line } = await params;
  const key = LINE_BY_SLUG[line];
  if (!key) notFound();

  const label = LINE_LABEL[key];
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

  const other: ProductLine = key === "LEONE" ? "FERITO" : "LEONE";

  return (
    <>
      <Header />

      <main id="main" className="flex-1">
        {/*
          ── 1 머리 + 2 다섯 칸 — 2026-10-06 고객 요청: 가이드 그림 그대로 **검은 바탕 · 빨간 라인 이름 · 가운데 정렬**.
          전에는 사이트의 와인 바닥으로 옮겨 그렸는데, 가이드의 검정 · 빨강을 그대로 쓰기로 했다.
          색 대비(검정 위): 빨강 #E0202E 4.6:1(큰 글자 기준 3:1 통과) · 흰 글자 21:1 · 회색 글자 #B5B5B5 10:1.
          다섯 칸은 넓은 화면에서 한 줄 다섯, 좁은 화면은 2열(다섯째 칸은 가운데 줄 아래로 간다).
        */}
        <section aria-labelledby="line-heading" className="bg-[#000000]">
          <div className="mx-auto max-w-[1320px] px-5 py-16 text-center md:px-15 md:py-24">
            <h1
              id="line-heading"
              className="font-display leading-display tracking-display text-3xl text-[#E0202E] md:text-4xl"
            >
              {label.en}
            </h1>
            <p className="mt-8 text-sm text-[#F5F5F5]">{label.kind} 라인</p>
            <p className="mt-4 text-sm text-[#F5F5F5]">{label.description}</p>
            {/* 이 라인이 왜 존재하는지 — 문안을 받기 전이다 (머리말 "아직 없는 글") */}
            <p className="mt-4 text-sm text-[#B5B5B5]">{pendingLabel("라인 소개 문안")}</p>

            <ul className="mt-12 grid grid-cols-2 gap-3 md:mt-16 md:grid-cols-5 md:gap-3">
              {Array.from({ length: TILE_COUNT }, (_, i) => {
                const photo = photos[i];
                // 좁은 화면의 다섯째 칸: 두 칸을 차지하고 그 안에서 가운데 — 폭은 안쪽 figure 가 맡는다(li 에 w-auto 를 주면 grid 안에서 0 이 된다)
                return (
                  <li key={i} className={i === 4 ? "col-span-2 flex justify-center md:col-span-1 md:block" : undefined}>
                    {/* 사진이 없으면 가이드의 회색 칸 그대로 */}
                    <figure className={`relative aspect-[3/4] overflow-hidden bg-[#D9D9D9] ${i === 4 ? "w-[calc(50%-0.375rem)] md:w-auto" : ""}`}>
                      {photo && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={photo.url} alt={photo.alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top" />
                      )}
                    </figure>
                  </li>
                );
              })}
            </ul>
            <h2 className="mt-5 text-sm text-[#F5F5F5]">페인포인트와 니즈 포인트</h2>
            <p className="mt-2 text-xs text-[#B5B5B5]">{pendingLabel("칸별 내용")}</p>
          </div>
        </section>

        {/* ── 3 상품 — 분류별로 쭉. 고르는 곳은 크림 ── */}
        <div className="on-cream">
          <div className="mx-auto max-w-[1320px] px-5 py-20 md:px-15 md:py-28">
            {groups.length > 0 ? (
              <div className="flex flex-col gap-20">
                {groups.map(({ category, items }) => (
                  <section key={category} aria-labelledby={`line-${category}`}>
                    <Eyebrow>{CATEGORY_LABEL[category].en}</Eyebrow>
                    <h2
                      id={`line-${category}`}
                      className="font-display text-primary leading-display tracking-display mt-3 text-3xl"
                    >
                      {CATEGORY_LABEL[category].ko}
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

            {/* 다른 라인으로 — 라인은 둘뿐이라 비교하러 건너가는 길이 곧 다음 행동이다 */}
            <div className="border-subtle mt-20 flex justify-center border-t pt-10">
              <Link
                href={`/line/${other.toLowerCase()}/`}
                className="group border-interactive text-accent hover:border-accent hover:bg-accent-tint ease-fluid tracking-button inline-flex min-h-11 items-center gap-2.5 rounded-full border px-6 text-xs transition-all duration-500"
              >
                {LINE_LABEL[other].ko} 보기
                <ArrowRight
                  size={13}
                  weight="light"
                  aria-hidden="true"
                  className="ease-fluid transition-transform duration-500 group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
