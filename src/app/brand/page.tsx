import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * 브랜드 가치관 (요구사항 2-1).
 *
 * 정보를 전달하는 페이지가 아니라 **감정을 남기는 페이지**다. 그래서 글보다 사진의 비중이 크다.
 * 슬로건·키워드·첫인상 문장은 BRAND_BRIEF.md 1-1 의 고객 전달 문안 그대로다.
 *
 * 면 순서: 히어로(사진 + 와인 판) → 키워드 크림 → 첫인상 크림 → 푸터.
 *
 * TODO(고객확인) 브랜드 촬영본. 지금 사진은 제품 촬영본으로 자리를 잡아 둔 것이다.
 */

export const metadata: Metadata = {
  title: "브랜드",
  description:
    "상위 0.1%의 남자. 잘 관리된 몸매와 외모, 섹시한 핏으로 소화하는 럭셔리 스타일.",
};

/** 고객 전달 키워드 그대로. 순서도 그대로다. */
const KEYWORDS = [
  "남성성",
  "섹시함",
  "우월감",
  "동경심",
  "퇴폐미",
  "경외심",
  "럭셔리",
  "품격",
  "고급",
  "초연함",
  "담대함",
];

export default function BrandPage() {
  return (
    <>
      <Header />

      <main id="main" className="flex-1">
        {/*
          히어로 — 왼쪽 사진, 오른쪽 와인 판. 모바일에서는 사진이 위, 글이 아래로 쌓인다.
          사진 배경이 버건디라 와인 면과 한 공기다.
        */}
        <section
          className="bg-stage grid md:grid-cols-[minmax(0,1fr)_minmax(0,520px)]"
          aria-labelledby="brand-heading"
        >
          <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[600px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/products/photo-brown-shirt.webp"
              alt="버건디 배경 앞에 선 남성 모델 — 브라운 셔츠와 블랙 트라우저"
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
          </div>

          <div className="flex flex-col justify-center gap-5 px-5 py-12 md:px-13 md:py-16">
            <Reveal>
              <Eyebrow>BRAND</Eyebrow>
            </Reveal>
            <Reveal delay={80}>
              <h1
                id="brand-heading"
                className="font-display text-primary leading-display tracking-display text-4xl md:text-[3.25rem]"
              >
                상위 0.1%의 남자
              </h1>
            </Reveal>
            <Reveal delay={160}>
              {/*
                ⚠️ md:text-base 를 쓰면 안 된다. 이 프로젝트에는 색 토큰 `base`(bg-base)가 있어서
                Tailwind 가 text-base 를 글자 크기가 아니라 **글자색(딥)** 으로 푼다 —
                와인 면 위에 검은 글자가 되어 1.31:1 이 났다. 크기는 값으로 직접 준다.
              */}
              <p className="text-secondary max-w-[40ch] text-sm leading-relaxed md:text-(length:--fs-base)">
                잘 관리된 몸매와 외모, 섹시한 핏으로 소화하는 럭셔리 스타일. 담대하고
                우월한 태도까지 갖춘 모두의 워너비.
              </p>
            </Reveal>
          </div>
        </section>

        <div className="on-cream">
          {/* ── 키워드 — 무드를 낱말로 ───────────────────── */}
          <section
            className="mx-auto max-w-[1320px] px-5 pt-16 md:px-15 md:pt-24"
            aria-labelledby="keywords-heading"
          >
            <Reveal>
              <p className="text-accent text-2xs tracking-label">02 · 키워드</p>
            </Reveal>
            <Reveal delay={80}>
              <h2
                id="keywords-heading"
                className="font-display text-primary leading-display tracking-display mt-3 text-2xl md:text-3xl"
              >
                이 브랜드가 지향하는 것
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <ul className="mt-7 flex flex-wrap gap-2">
                {KEYWORDS.map((k) => (
                  <li
                    key={k}
                    className="border-strong bg-surface text-secondary rounded-full border px-4 py-2 text-xs"
                  >
                    {k}
                  </li>
                ))}
              </ul>
            </Reveal>
          </section>

          {/* ── 첫인상 — "나도 저렇게 되고 싶다" ─────────── */}
          <section
            className="mx-auto grid max-w-[1320px] items-center gap-10 px-5 py-16 md:grid-cols-[minmax(0,1fr)_minmax(0,460px)] md:gap-16 md:px-15 md:py-24"
            aria-labelledby="impression-heading"
          >
            <div className="min-w-0">
              <Reveal>
                <p className="text-accent text-2xs tracking-label">03 · 첫인상</p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  id="impression-heading"
                  className="font-display text-primary leading-display tracking-display mt-3 text-2xl md:text-3xl"
                >
                  첫인상으로 남겨야 하는 것
                </h2>
              </Reveal>
              <Reveal delay={160}>
                {/* 크림 위 강조는 와인이다 — 골드는 여기서 1.87:1 로 안 보인다 */}
                <blockquote className="font-display text-accent leading-display mt-6 text-xl md:text-2xl">
                  &ldquo;와, 나도 저렇게 되고 싶다.
                  <br />
                  저 사람처럼 되고 싶다.&rdquo;
                </blockquote>
              </Reveal>
              <Reveal delay={240}>
                <p className="text-secondary mt-6 max-w-[46ch] text-sm leading-relaxed">
                  레오네 페리토가 남기려는 첫인상은 이 한 문장입니다. 옷을 설명하는
                  대신, 입은 사람을 보여드립니다.
                </p>
              </Reveal>
            </div>

            <Reveal delay={200} className="min-w-0">
              <div className="border-subtle bg-band/50 shadow-soft rounded-[2rem] border p-2">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[calc(2rem-0.5rem)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/tailoring.webp"
                    alt="테일러가 재킷의 어깨선을 손으로 다듬는 장면"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </Reveal>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
