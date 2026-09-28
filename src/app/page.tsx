import { ExchangeNotice } from "@/components/home/ExchangeNotice";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { FitCompare } from "@/components/home/FitCompare";
import { Hero } from "@/components/home/Hero";
import { HeroSplit } from "@/components/home/HeroSplit";
import { SizeFinder } from "@/components/home/SizeFinder";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Reveal } from "@/components/motion/Reveal";
import { PRODUCTS } from "@/data/products";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * 메인.
 *
 * ── 구간 순서와 그 이유 ────────────────────────────────
 *   히어로      제품 한 점을 이름·가격·버튼과 함께. 넘기면 다음 제품 (캠페인)
 *   WHY         왜 실측을 다 공개하는가 — 격자를 만나기 전에 읽는 법을 준다
 *   제품        카탈로그. 히어로와 같은 제품이지만 역할이 다르고, 사이에 한 섹션이 끼어
 *                한 화면 안에서 두 번 보이지 않는다. 실측 요약이 붙은 카드다
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

const PILLARS = [
  {
    no: "01",
    title: "핏 구분",
    body: "운동체형과 일반체형 패턴을 나눠 제작합니다. 상품마다 어느 쪽인지 표시합니다.",
  },
  {
    no: "02",
    title: "상세 실측",
    body: "사이즈별 어깨·가슴·허리·소매·총장을 전부 공개합니다. 측정 기준과 허용 오차까지 밝힙니다.",
  },
  {
    no: "03",
    title: "모델 체형",
    body: "모델의 키·몸무게·착용 사이즈를 함께 표기해 내 체형과 비교할 수 있게 합니다.",
  },
];

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

        {/* 실측을 왜 공개하는지 먼저 말한다 — 아래 카드의 실측 요약이 그제야 읽힌다 */}
        <section className="bg-band border-subtle border-y">
          <div className="mx-auto max-w-[1320px] px-5 py-24 md:px-15 md:py-36">
            <Reveal>
              <Eyebrow>WHY LEONE FERITO</Eyebrow>
            </Reveal>

            <Reveal delay={100}>
              <h2 className="font-display text-primary leading-display tracking-display mt-4 max-w-2xl text-3xl md:text-4xl">
                사진이 아니라 치수로 고르세요
              </h2>
            </Reveal>

            <Reveal delay={180}>
              <p className="text-secondary mt-6 max-w-2xl text-base">
                어깨·가슴·허벅지는 끼는데 허리는 남는 옷을 입어 오셨다면, 문제는
                체형이 아니라 패턴입니다. 모든 상품에 사이즈별 상세 실측과 모델
                착용 정보를 공개합니다.
              </p>
            </Reveal>

            {/*
              상자를 뺐다. 셋은 나란한 근거이지 서로 다른 상품이 아니라, 같은 크기의
              카드 셋으로 두면 브로셔의 "3가지 특징" 으로 읽힌다.
              대신 헤어라인 위에 두고 데스크톱에서만 계단식으로 내려 읽는 순서를 만든다.
              모바일은 한 열로 접힌다 — 오프셋은 넓은 화면에서만 뜻이 있다.
            */}
            <ol className="mt-16 grid gap-10 md:grid-cols-12 md:gap-x-8">
              {PILLARS.map((item, i) => (
                <li
                  key={item.no}
                  className={`border-subtle border-t pt-6 md:col-span-4 ${
                    ["", "md:mt-14", "md:mt-28"][i]
                  }`}
                >
                  <Reveal delay={i * 120}>
                    <span className="text-muted text-2xs tracking-label tabular-nums">
                      {item.no}
                    </span>
                    <h3 className="font-display text-primary mt-5 text-xl">
                      {item.title}
                    </h3>
                    <p className="text-secondary mt-3 max-w-[34ch] text-sm leading-relaxed">
                      {item.body}
                    </p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <FeaturedProducts products={FEATURED} />

        <FitCompare />

        <SizeFinder />

        <ExchangeNotice />
      </main>

      <Footer />
    </>
  );
}
