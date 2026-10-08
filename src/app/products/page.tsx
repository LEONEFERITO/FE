import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ProductList } from "@/components/product/ProductList";
import { filterOptions, getCatalog } from "@/lib/catalog";
import { shareMetadata } from "@/lib/metadata";

/**
 * 제품 목록.
 *
 * 정적 내보내기라 필터는 **브라우저에서** 돈다. 상품이 수천 개가 되면 서버 페이지네이션이
 * 필요하지만, 지금 규모(수십 개)에서 서버 왕복을 넣으면 필터 반응만 느려진다.
 *
 * 목록 데이터는 이 서버 컴포넌트가 들고 있다가 클라이언트 컴포넌트에 넘긴다.
 * 그래야 필터 UI 만 JS 로 내려가고 **상품 정보는 HTML 에 박혀 나간다** (검색 노출).
 */

export const metadata: Metadata = shareMetadata({
  title: "제품",
  description:
    "운동으로 달라진 체형을 위한 남성 기성복. 상품마다 핏 종류와 사이즈별 상세 실측을 공개합니다.",
});

export default async function ProductsPage() {
  const products = await getCatalog();
  const { categories, sizes } = filterOptions(products);

  return (
    <>
      <Header />

      <main id="main" className="on-cream on-white flex-1">
        {/* 가운데 제목 (2026-10-08 LYFT 구성). 전에는 와인 띠 + 왼쪽 제목이었다 */}
        <header className="px-5 py-10 text-center md:py-14">
          <h1 className="font-display text-primary tracking-[0.18em] text-2xl uppercase md:text-3xl">All Products</h1>
          <p className="text-secondary mt-2 text-sm">전체 제품 · 상품마다 핏 종류와 사이즈별 상세 실측을 표기합니다</p>
        </header>

        <div className="pb-24 md:pb-32">
          <ProductList products={products} categories={categories} sizes={sizes} />
        </div>
      </main>

      <Footer />
    </>
  );
}
