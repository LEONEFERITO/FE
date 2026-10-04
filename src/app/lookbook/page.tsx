import type { Metadata } from "next";
import Link from "next/link";

import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { shareMetadata } from "@/lib/metadata";

/**
 * 룩북 (요구사항 2-3).
 *
 * 사진이 주인공이고 글자는 최소다. 와인 면 위에 버건디 촬영 원본이 놓인다 — 한 공기.
 *
 * ── 격자는 잠정이다 ─────────────────────────────────────
 * "큰 컷 + 작은 컷" 의 리듬만 잡아 둔 것이다. 룩북 촬영본이 오면 컷의 비율과 수량을
 * 보고 다시 짠다. 지금 사진은 제품 촬영본으로 자리를 채운 것이다.
 *
 * TODO(고객확인) 룩북 촬영본 · 엠버서더/모델 구분 · 컷을 누르면 상품으로 이어질지.
 */

export const metadata: Metadata = shareMetadata({
  title: "룩북",
  description: "레오네 페리토 룩북. 엠버서더와 모델 스타일링.",
});

const CUTS = [
  { src: "/products/photo-black-shirt.webp", alt: "블랙 셔츠 룩 — 전신", span: "md:col-span-7", tall: true },
  { src: "/products/photo-white-shirt.webp", alt: "화이트 셔츠 룩 — 전신", span: "md:col-span-5", tall: true },
  { src: "/products/photo-brown-shirt.webp", alt: "브라운 셔츠 룩", span: "md:col-span-4", tall: false },
  { src: "/brand/tailoring.webp", alt: "테일러링 디테일 — 어깨선을 다듬는 손", span: "md:col-span-4", tall: false },
  { src: "/products/photo-grey-shirt.webp", alt: "그레이 셔츠 룩", span: "md:col-span-4", tall: false },
];

export default function LookbookPage() {
  return (
    <>
      <Header />

      <main id="main" className="flex-1">
        {/* 와인 면 — 제목과 사진이 한 면에 있다. 룩북은 제목 띠를 따로 나누지 않는다. */}
        <section className="bg-stage" aria-labelledby="lookbook-heading">
          <div className="mx-auto max-w-[1320px] px-5 py-12 md:px-15 md:py-16">
            <Eyebrow>LOOKBOOK</Eyebrow>
            <h1
              id="lookbook-heading"
              className="font-display text-primary leading-display tracking-display mt-3 text-3xl md:text-4xl"
            >
              룩북
            </h1>

            <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-12">
              {CUTS.map((c, i) => (
                <li key={c.src} className={`min-w-0 ${c.span}`}>
                  <Reveal delay={i * 60}>
                    <div
                      className={`border-velvet/40 bg-velvet-deep relative overflow-hidden rounded-2xl border ${
                        c.tall ? "aspect-[4/5] md:aspect-[4/3]" : "aspect-[4/5] md:aspect-square"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.src}
                        alt={c.alt}
                        loading={i < 2 ? "eager" : "lazy"}
                        className="absolute inset-0 h-full w-full object-cover object-top"
                      />
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>

            {/* TODO(고객확인) 룩북 촬영본이 오면 이 문장은 빠진다 */}
            <p className="text-secondary mt-8 text-xs">
              룩북 촬영 예정 · 지금 보이는 컷은 제품 촬영본입니다.
            </p>
          </div>
        </section>

        <div className="on-cream">
          <div className="mx-auto flex max-w-[1320px] flex-col items-start gap-4 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-15 md:py-16">
            <p className="text-secondary max-w-[46ch] text-sm leading-relaxed">
              룩에 쓰인 옷은 컬렉션에서 사이즈별 상세 실측과 함께 보실 수 있습니다.
            </p>
            <Link
              href="/products"
              className="bg-accent text-on-accent hover:bg-accent-hover shadow-button ease-fluid tracking-button inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm transition-all duration-500 hover:-translate-y-px"
            >
              컬렉션 보기
              <ArrowRight size={13} weight="light" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
