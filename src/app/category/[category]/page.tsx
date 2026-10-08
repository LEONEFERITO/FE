import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CategoryProducts, CategoryProductsFromUrl } from "@/components/product/CategoryProducts";
import { CATEGORY_NAV, CATEGORY_SUBS } from "@/data/categories";
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
 * 2026-10-08 고객 요청(레퍼런스 LYFT)으로 다시 바뀌었다: 위치 표시 없이 **가운데 제목**, 그 아래 화면 끝까지 닿는
 * 도구 줄(칸 수 · 정렬), PC 는 왼쪽에 글자 거르기, 폰은 FILTER 시트. 격자는 카드 사이를 조금만 띄운다(ProductBrowser).
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

      <main id="main" className="on-cream on-white flex-1">
        {/* 가운데 제목 (2026-10-08 LYFT 구성) — 영문 분류명은 넓은 자간 · 대문자, 아래 한글 */}
        <header className="px-5 py-10 text-center md:py-14">
          <h1 className="font-display text-primary tracking-[0.18em] text-2xl uppercase md:text-3xl">{entry.title}</h1>
          <p className="text-secondary mt-2 text-sm">{ko}</p>
        </header>

        {/* 카드의 상품명이 h3 이라 그 위 단계를 둔다 — 화면에는 보이지 않는다 */}
        <h2 className="sr-only">{ko} 상품 목록</h2>
        <div className="pb-24 md:pb-32">
          {/* 세부 메뉴(?sub=)는 브라우저에서 읽는다. 빌드 HTML 에는 분류 전체가 나간다 */}
          <Suspense fallback={<CategoryProducts products={products} />}>
            <CategoryProductsFromUrl products={products} categorySlug={entry.slug} subs={CATEGORY_SUBS[entry.category] ?? []} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  );
}
