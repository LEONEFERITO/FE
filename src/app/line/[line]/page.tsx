import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ProductCard } from "@/components/product/ProductCard";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getCatalog } from "@/lib/catalog";
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
 * 다섯 칸의 사진은 그 라인 상품의 사진을 앞에서부터 채운다. 모자라면 버건디 면으로 남는다(가이드의 회색 칸).
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
  const photos = products.flatMap((p) => p.images).slice(0, TILE_COUNT);
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: products.filter((p) => p.category === category),
  })).filter((g) => g.items.length > 0);

  const other: ProductLine = key === "LEONE" ? "FERITO" : "LEONE";

  return (
    <>
      <Header />

      <main id="main" className="flex-1">
        {/* ── 1 머리 + 2 다섯 칸. 가이드의 검은 화면 — 이 사이트의 가장 깊은 와인으로 옮겼다 ── */}
        <section aria-labelledby="line-heading" className="border-subtle border-b">
          <div className="mx-auto max-w-[1320px] px-5 py-16 md:px-15 md:py-24">
            <div className="mx-auto max-w-2xl text-center">
              {/* 가이드는 라인 이름을 빨강으로 적었다. 이 바닥 위 버건디는 1.9:1 이라 사라진다 — 골드로 둔다 */}
              <h1
                id="line-heading"
                className="font-display text-accent leading-display tracking-display text-4xl md:text-(length:--fs-hero)"
              >
                {label.en}
              </h1>
              <p className="text-primary tracking-label mt-6 text-sm">{label.kind} 라인</p>
              <p className="text-secondary mt-4 text-(length:--fs-base) leading-relaxed">{label.description}</p>
              {/* 이 라인이 왜 존재하는지 — 문안을 받기 전이다 (머리말 "아직 없는 글") */}
              <p className="text-muted mt-4 text-sm">{pendingLabel("라인 소개 문안")}</p>
            </div>

            <div className="mt-14 md:mt-20">
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
                {Array.from({ length: TILE_COUNT }, (_, i) => {
                  const photo = photos[i];
                  return (
                    /*
                      칸 수는 줄마다 딱 떨어지게: 좁은 화면 2열 × 2줄(넷), 중간 3열 × 1줄(셋), 넓은 화면 5열(다섯).
                      다섯을 2열 · 3열에 그대로 흘리면 마지막 줄에 한두 칸만 남아 덜 채운 격자로 보인다.
                    */
                    <li key={i} className={i === 3 ? "sm:hidden lg:block" : i === 4 ? "hidden lg:block" : undefined}>
                      <figure className="bg-velvet relative aspect-[3/4] overflow-hidden rounded-xl">
                        {photo && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={photo.url} alt={photo.alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top" />
                        )}
                        <figcaption className="text-2xs tracking-label absolute left-3 top-3 tabular-nums text-[#F7F1EA]/80">
                          {String(i + 1).padStart(2, "0")}
                        </figcaption>
                      </figure>
                    </li>
                  );
                })}
              </ul>
              <h2 className="text-primary mt-6 text-center text-sm">페인포인트와 니즈 포인트</h2>
              <p className="text-muted mt-2 text-center text-xs">{pendingLabel("칸별 내용")}</p>
            </div>
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
