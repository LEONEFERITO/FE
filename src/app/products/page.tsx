import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ProductList } from "@/components/product/ProductList";
import { CATEGORIES, PRODUCTS, SIZE_OPTIONS } from "@/data/products";

/**
 * 제품 목록.
 *
 * 정적 내보내기라 필터는 **브라우저에서** 돈다. 상품이 수천 개가 되면 서버 페이지네이션이
 * 필요하지만, 지금 규모(수십 개)에서 서버 왕복을 넣으면 필터 반응만 느려진다.
 *
 * 목록 데이터는 이 서버 컴포넌트가 들고 있다가 클라이언트 컴포넌트에 넘긴다.
 * 그래야 필터 UI 만 JS 로 내려가고 **상품 정보는 HTML 에 박혀 나간다** (검색 노출).
 */

export const metadata: Metadata = {
  title: "제품",
  description:
    "운동으로 달라진 체형을 위한 남성 기성복. 상품마다 핏 종류와 사이즈별 상세 실측을 공개합니다.",
};

export default function ProductsPage() {
  return (
    <>
      <Header />

      <main id="main" className="flex-1">
        {/*
          제목 띠만 와인, 고르는 곳은 크림 (색 시안 · 목록).
          필터와 상품이 같은 면에 있어야 칩을 누르고 결과를 바로 이어서 본다.
          와인은 "여기부터 목록" 을 알리는 띠로만 쓴다.
        */}
        <div className="bg-stage">
          <div className="mx-auto max-w-[1320px] px-5 py-12 md:px-15 md:py-16">
            <Eyebrow>COLLECTION</Eyebrow>
            <h1 className="font-display text-primary leading-display tracking-display mt-3 text-3xl md:text-4xl">
              제품
            </h1>
            <p className="text-secondary mt-4 max-w-xl text-sm">
              모든 상품에 핏 종류와 사이즈별 상세 실측을 표기합니다. 사진이 아니라
              치수로 고르세요.
            </p>
          </div>
        </div>

        {/*
          flow-root: ProductList 첫 요소의 mt-12 가 이 래퍼 밖으로 빠져나가(마진 병합)
          와인 띠와 크림 사이에 페이지 바닥(딥)이 줄로 드러났다. 새 서식 맥락을 만들어 안에 가둔다.
        */}
        <div className="on-cream flow-root">
          <div className="mx-auto max-w-[1320px] px-5 pb-12 md:px-15 md:pb-20">
            <ProductList
              products={PRODUCTS}
              categories={CATEGORIES}
              sizes={SIZE_OPTIONS}
            />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
