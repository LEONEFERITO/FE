import fs from "node:fs";
import path from "node:path";

import { BrandManual } from "@/components/home/BrandManual";
import { Connect } from "@/components/home/Connect";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Hero } from "@/components/home/Hero";
import { HeroReveal } from "@/components/home/HeroReveal";
import { HeroSplit } from "@/components/home/HeroSplit";
import { LineChooser } from "@/components/home/LineChooser";
import { OfflineShop } from "@/components/home/OfflineShop";
import { WhyScroll } from "@/components/home/WhyScroll";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getWhy } from "@/lib/why";
import { getCatalog } from "@/lib/catalog";
import { getSiteImages } from "@/lib/siteImages";

/**
 * 메인.
 *
 * ── 구간 순서 (2026-10-05 고객 디자인 가이드 — "메인 화면 구성 이렇게로 싹 바꿔주세요") ──
 * 가이드가 스크롤 순서대로 화면을 그려 줬고, 그 순서를 그대로 따른다:
 *
 *   1 첫 화면   모델 사진 위에 "사진이 아니라 치수로 고르세요" 글자 판 — WHY 구간이 히어로가 된다
 *   2 브랜드    브랜드 문장 두 줄 + 브랜드 이용 메뉴얼(여섯 주제 → 이용 안내의 카드)
 *   3 두 라인   레오네 · 페리토 카드(→ 라인 페이지) + 맞춤 정장
 *   4 제품      카탈로그 격자 (그대로)
 *   5 채널      QnA · 카카오톡 채널 · 인스타그램 · 유튜브
 *   6 매장      OFFLINE SHOP — 주소 · 운영시간
 *   7 푸터
 *
 * 가이드에 없는 구간은 메인에서 내렸다: 카테고리 격자(헤더 내비가 분류가 되면서 역할이 겹친다),
 * 핏 비교 · 사이즈 찾기 · 교환 안내. 컴포넌트는 남아 있다 — 사이즈 찾기는 가이드에서 옆으로 빼 둔
 * 캡처로만 있어 "뺀다" 로 읽었다. TODO(고객확인) 사이즈 찾기 · 핏 비교를 이용 안내로 옮길지.
 *
 * ── 면 순서 ─────────────────────────────────────────────
 *   첫 화면(사진 + 크림 판) → 브랜드 · 두 라인(딥 와인) → 제품 · 채널 · 매장(크림) → 푸터(딥)
 * 가이드의 검정은 이 사이트의 가장 깊은 와인(바닥색)으로, 흰 면은 크림으로 옮겼다.
 * 크림 구간은 토큰만 뒤집는다 — 안의 컴포넌트는 그대로다 (globals.css .on-cream).
 *
 * ── 히어로 네 가지 ─────────────────────────────────────
 *   "why"    : 위 1번. 지금 쓰는 것.
 *   "reveal" : 크림 종이 위 누끼 한 명, 스크롤하면 양옆 액자 컷이 들어온다 (2026-10-04, TNGT 레퍼런스).
 *   "split"  : 왼쪽 브랜드 판 + 오른쪽 제품 사진 한 장.
 *   "stage"  : 두 인물이 거대한 워드마크를 딛고 선 무대.
 * 상수 하나로 전환한다. why 가 아닌 변형에서는 WHY 구간이 예전 자리(제품 위)로 돌아간다.
 *
 * 브랜드 문구·촬영본이 확정되기 전이라 카피는 TODO(고객확인) 로 둔다.
 * 넘겨짚어 쓰지 않는다 — 브랜드 문구는 검색 결과와 공유 미리보기에 그대로 박혀 나간다.
 */

/*
 * 2026-10-05 결정: 첫 화면은 **reveal**(어제의 배너)로 간다. 가이드의 첫 화면(사진 + 글자 판)은
 * 없애지 않고 배너 바로 아래에 판 모양으로 둔다 — 가이드가 그린 화면은 순서대로 전부 남는다.
 */
const HERO_VARIANT: "why" | "reveal" | "split" | "stage" = "reveal";

/**
 * 기본 사진 — 줄자로 어깨를 재는 장면. WHY 항목에 관리자가 사진을 올리지 않았을 때의 배경이고,
 * 매장 구간의 자리 표시 사진이기도 하다.
 * 빌드 시점에 파일이 있는지 확인한다 — 없으면 사진 없이 바탕색으로 두고, 깨진 이미지도 404 도 나가지 않는다.
 */
const WHY_BACKGROUND = "/brand/tailoring.webp";

function whyBackground(): string | null {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", WHY_BACKGROUND)) ? WHY_BACKGROUND : null;
  } catch {
    return null;
  }
}

export default async function Home() {
  /** WHY 구간 — 관리자가 고친 문구와 사진. 빌드 때 받는다(lib/why.ts). */
  const why = await getWhy();
  const catalog = await getCatalog();
  /** 메인에 노출할 제품. 촬영본이 있는 것만 — 빈 카드가 섞이면 준비 안 된 가게로 보인다. */
  const FEATURED = catalog.filter((p) => p.images.length > 0).slice(0, 4);
  const background = whyBackground();
  /** 관리자가 올린 사진 칸(매장 사진 등). 빌드 때 받는다 — 칸이 비어 있으면 아래에서 기본 사진으로 메운다. */
  const siteImages = await getSiteImages();

  return (
    <>
      {/*
        투명 헤더는 와인 히어로(split · stage) 전용이다. 그 상태(검정 스크림 + 크림 글자)를 밝은 첫 화면에
        올리면 뿌연 띠가 되고 글자는 아래쪽에서 사라진다. why · reveal 에서는 평소의 와인 유리 바가 천장이 된다.
      */}
      <Header overHero={HERO_VARIANT === "split" || HERO_VARIANT === "stage"} />

      <main id="main" className="flex-1">
        {HERO_VARIANT === "why" ? (
          <div className="on-cream">
            <WhyScroll hero content={why} fallbackImage={background} />
          </div>
        ) : (
          <>
            {HERO_VARIANT === "reveal" && FEATURED[0] ? (
              /* reveal 은 한 룩만 보여준다. 촬영본이 있는 제품이 하나도 없으면 분할형으로 — 빈 무대를 내보내지 않는다 */
              <HeroReveal product={FEATURED[0]} />
            ) : HERO_VARIANT === "stage" ? (
              <Hero />
            ) : (
              <HeroSplit products={FEATURED} />
            )}
            {/*
              가이드의 첫 화면 — 배너를 쓰는 변형에서는 배너 바로 아래다. 가이드가 그린 모양(사진 위 크림 판)
              그대로 서되 제목은 h2 다. h1 은 배너가 갖는다.
            */}
            <div className="on-cream">
              <WhyScroll panel content={why} fallbackImage={background} />
            </div>
          </>
        )}

        <BrandManual />
        {/* 카드 사진은 그 라인의 첫 상품 사진 — 촬영본이 있는 것만이 아니라 전체 카탈로그에서 찾는다 */}
        <LineChooser products={catalog} />

        <div className="on-cream">
          <FeaturedProducts products={FEATURED} />
          <Connect />
          {/* 매장 사진은 관리자가 올린 것(/admin/display/offline). 아직 없으면 기본 사진 */}
          <OfflineShop
            image={siteImages.OFFLINE_SHOP?.url ?? background}
            alt={siteImages.OFFLINE_SHOP?.alt}
          />
        </div>
      </main>

      <Footer />
    </>
  );
}
