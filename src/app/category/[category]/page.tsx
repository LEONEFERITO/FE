import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CategoryProducts } from "@/components/product/CategoryProducts";
import { CATEGORY_NAV } from "@/data/categories";
import { getCatalog } from "@/lib/catalog";
import { shareMetadata } from "@/lib/metadata";
import { CATEGORY_LABEL } from "@/types/product";

/**
 * 카테고리 페이지 — 헤더 내비의 분류를 누르면 오는 곳 (2026-10-05 고객 디자인 가이드).
 *
 * "이 셔츠 카테고리 누르면 해당 링크 페이지처럼 화면 구성 부탁드립니다. 슈즈, 자켓, 수트 카테고리 등등
 * 모두 동일 레이아웃으로 구성해주세요" — 기준은 기존 몰의 분류 페이지다(leoneferito.kr/category/Shirts/45/):
 * 위치 표시(홈 / Shirts) → 가운데 제목 → 총 N개 · 정렬 → 상품 격자. 여섯 분류가 전부 이 한 파일로 그려진다.
 *
 * ── /products?category= 와의 관계 ────────────────────────
 * 전체 제품 목록(/products)의 분류 필터는 그대로 있다. 그쪽은 핏 · 사이즈 · 재고까지 겹쳐 고르는 화면이고,
 * 여기는 "이 분류에 무엇이 있나" 를 바로 보여주는 화면이다. 그리고 분류마다 주소와 제목(HTML)이 따로 있어
 * 검색과 공유 미리보기에 분류 이름이 박힌다 — 쿼리스트링 필터로는 안 되는 일이다(정적 내보내기).
 *
 * 정적 내보내기라 주소 목록을 빌드 때 만든다. 목록은 내비와 같은 CATEGORY_NAV 다 — 상품이 없는 분류도
 * 페이지가 있어야 내비가 404 로 가지 않는다.
 */

export function generateStaticParams() {
  return CATEGORY_NAV.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/category/[category]">): Promise<Metadata> {
  const { category } = await params;
  const entry = CATEGORY_NAV.find((c) => c.slug === category);
  if (!entry) return {};
  const ko = CATEGORY_LABEL[entry.category].ko;
  return shareMetadata({
    title: `${entry.title} · ${ko}`,
    description: `LEONE FERITO ${ko}. 상품마다 핏 종류와 사이즈별 상세 실측을 공개합니다.`,
  });
}

export default async function CategoryPage({ params }: PageProps<"/category/[category]">) {
  const { category } = await params;
  const entry = CATEGORY_NAV.find((c) => c.slug === category);
  if (!entry) notFound();

  const products = (await getCatalog()).filter((p) => p.category === entry.category);
  const ko = CATEGORY_LABEL[entry.category].ko;

  return (
    <>
      <Header />

      <main id="main" className="on-cream flex-1">
        <div className="mx-auto max-w-[1320px] px-5 pb-24 md:px-15 md:pb-32">
          {/* 위치 표시 — 기존 몰처럼 오른쪽 위. 현재 위치는 링크가 아니다 */}
          <nav aria-label="현재 위치" className="flex justify-end pt-6">
            <ol className="text-muted flex items-center gap-2 text-xs">
              <li>
                {/* min-w-6: "홈" 한 글자는 폭이 12px 라 표적 기준(24×24)에 못 미친다 — QA 에서 잡혔다. 높이만 채워서는 모자라다 */}
                <Link href="/" className="hover:text-primary ease-fluid inline-flex min-h-11 min-w-6 items-center justify-center transition-colors duration-300">
                  홈
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-secondary">
                {entry.title}
              </li>
            </ol>
          </nav>

          <header className="py-10 text-center md:py-16">
            <h1 className="font-display text-primary leading-display tracking-display text-4xl md:text-(length:--fs-hero)">
              {entry.title}
            </h1>
            <p className="text-secondary mt-3 text-sm">{ko}</p>
          </header>

          {/* 카드의 상품명이 h3 이라 그 위 단계를 둔다 — 화면에는 보이지 않는다 */}
          <h2 className="sr-only">{ko} 상품 목록</h2>
          <CategoryProducts products={products} />
        </div>
      </main>

      <Footer />
    </>
  );
}
