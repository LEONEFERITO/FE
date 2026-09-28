import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ExchangeNotice } from "@/components/home/ExchangeNotice";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { FitCompare } from "@/components/home/FitCompare";
import { Hero } from "@/components/home/Hero";
import { HeroSplit } from "@/components/home/HeroSplit";
import { WhySection } from "@/components/home/WhySection";
import { SizeFinder } from "@/components/home/SizeFinder";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PRODUCTS } from "@/data/products";

/**
 * 메인.
 *
 * ── 구간 순서와 그 이유 ────────────────────────────────
 *   히어로      제품 한 점을 이름·가격·버튼과 함께. 넘기면 다음 제품 (캠페인)
 *   WHY         왜 실측을 다 공개하는가 — 격자를 만나기 전에 읽는 법을 준다
 *   제품        카탈로그. 히어로와 같은 제품이지만 역할이 다르고, 사이에 한 섹션이 끼어
 *                한 화면 안에서 두 번 보이지 않는다. 실측 요약이 붙은 카드다
 *   카테고리    "셔츠 말고 다른 것도 있다" — 대표 4점을 본 직후가 이 말의 자리다.
 *                위가 카드(살 물건)라면 여기는 타일(갈 곳)이라 격자가 두 번 이어져도
 *                반복으로 읽히지 않는다
 *   핏 비교     그 주장의 증거. 문장이 아니라 표
 *   사이즈 찾기 증거를 본 사람이 바로 자기 사이즈를 확인한다
 *   교환 안내   마지막 벽("안 맞으면?")을 결제 직전이 아니라 여기서 치운다
 *
 * 히어로만 벨벳(버건디)이고 그 아래는 전부 베이지+화이트다.
 * 사진이 주인공인 구간만 벨벳이다 — 제품 사진의 배경이 이미 버건디이기 때문이다.
 *
 * ── 히어로 두 가지 ─────────────────────────────────────
 *   "split" : 왼쪽 브랜드 판 + 오른쪽 제품 사진 한 장. 제품명·가격·버튼이 첫 화면에 있다.
 *             헤더는 평소 유리 알약 — 베이지/벨벳 반반 위에서 투명 헤더는 한쪽에서 사라진다.
 *   "stage" : 두 인물이 거대한 워드마크를 딛고 선 무대. 브랜드는 말하지만 물건은 안 판다.
 * 상수 하나로 전환한다. 둘 다 살아 있어야 나란히 비교할 수 있다.
 *
 * 브랜드 문구·촬영본이 확정되기 전이라 카피는 TODO(고객확인) 로 둔다.
 * 넘겨짚어 쓰지 않는다 — 브랜드 문구는 검색 결과와 공유 미리보기에 그대로 박혀 나간다.
 */

/** 메인에 노출할 제품. 촬영본이 있는 것만 — 빈 카드가 섞이면 준비 안 된 가게로 보인다. */
const FEATURED = PRODUCTS.filter((p) => p.images.length > 0).slice(0, 4);

const HERO_VARIANT: "split" | "stage" = "split";

export default function Home() {
  return (
    <>
      <Header overHero={HERO_VARIANT === "stage"} />

      <main id="main" className="flex-1">
        {HERO_VARIANT === "split" ? (
          <HeroSplit products={FEATURED} />
        ) : (
          <Hero />
        )}

        <WhySection />

        <FeaturedProducts products={FEATURED} />

        <CategoryGrid />

        <FitCompare />

        <SizeFinder />

        <ExchangeNotice />
      </main>

      <Footer />
    </>
  );
}
