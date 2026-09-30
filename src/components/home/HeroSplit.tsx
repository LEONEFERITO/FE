"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { CATEGORY_LABEL, LINE_LABEL, type Product } from "@/types/product";

/**
 * 히어로 — 제품 한 장.
 *
 * 데스크톱: 왼쪽 베이지 판(모노그램 · 이름 · 가격 · 버튼 · 워드마크) + 오른쪽 촬영 원본.
 * 모바일:  벨벳 한 판 위에 인물 · 이름 · 가격 · 버튼 · 워드마크를 세로로 쌓는다.
 *
 * 이커머스의 첫 화면은 제품명·가격·버튼이 있어야 한다. 누끼 무대 히어로는
 * 브랜드를 말했지 물건을 팔지 않았다.
 *
 * ── 사진이 화면마다 다른 이유 ────────────────────────────
 * 데스크톱은 촬영 원본을 그대로 쓴다 — 배경·조명·그림자가 사진 안에 있어 가장 자연스럽다.
 * 모바일은 벨벳 단색 면 위라서 원본을 놓으면 사진의 사각형 경계가 보인다. 그래서
 * 배경을 뺀 누끼를 세운다. <picture> 로 화면에 맞는 **한 장만** 내려받는다.
 *
 * ── 자동 회전을 넣지 않는 이유 ──────────────────────────
 * 자동 슬라이드는 두 번째 장을 거의 아무도 보지 않는다(배너 무시). 움직임에 민감한
 * 사용자에게는 접근성 문제고, 읽는 도중 바뀌면 화가 난다.
 * 첫 제품은 정적 HTML 에 박혀 나가고(LCP·검색), 나머지는 사용자가 ‹ › 로 넘긴다.
 *
 * ── 헤더 ───────────────────────────────────────────────
 * 이 히어로 위에서는 헤더를 투명하게 두지 않는다. 좌우가 사진(와인)과 정보 판(딥 와인)으로
 * 갈라져 있어, 투명하게 두면 어느 글자색을 골라도 한쪽에서 대비가 무너진다.
 * 화면 폭을 채운 와인 배너가 양쪽 다 읽히고, 사진의 천장 역할도 한다.
 *
 * 전환은 opacity 만 쓴다 — transform/opacity 외의 속성은 애니메이션하지 않는다.
 */

const KRW = new Intl.NumberFormat("ko-KR");

export function HeroSplit({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0);
  const liveId = useId();
  const count = products.length;
  const product = products[index];

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + count) % count),
    [count],
  );

  // 화살표 키. 버튼이 이미 키보드로 닿지만, 사진 위에 초점이 없어도 넘길 수 있게 한다.
  useEffect(() => {
    if (count < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, go]);

  if (!product) return null;

  const name = product.name ?? "제품명 확인 중";
  const fit = LINE_LABEL[product.line];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="대표 제품"
      /*
        헤더가 "히어로를 지났는가" 를 판단하는 표식.
        이게 없으면 Header 의 관찰자가 붙을 대상을 못 찾고 조용히 빠져나가,
        투명 상태가 페이지 끝까지 남는다 — 실제로 그렇게 깨져 있었다.
        무대형(Hero.tsx)에만 있었고 분할형으로 바꾸면서 빠졌다.
      */
      data-hero=""
      /*
        바탕은 --velvet-stage (#54090F). 고객 지정값이다.
        전에는 bg-velvet(#7B1526) 이었는데, 모바일에서 그 면이 화면 절반을 덮어
        거의 검정인 헤더·본문과 맞닿는 선에서 확 꺾였다(바닥 대비 1.82).
        이 값은 1.31 이라 이어지면서도 적와인이 남는다.
        이 면 위 글자 대비: 크림 13.16 · 보조 7.90 · 골드 7.04 — 전부 통과.
      */
      className="bg-stage grid min-h-[calc(100dvh-56px)] md:min-h-[calc(100dvh-72px)] md:grid-cols-2"
    >
      {/* ── 사진. 모바일은 위, 데스크톱은 오른쪽 ────────────────── */}
      <div className="relative order-first aspect-[4/5] overflow-hidden md:order-none md:aspect-auto">
        {/*
          모바일에 바닥 그라데이션을 깔지 않는다. 사진 칸 안에서만 어두워지면 아래 정보 판과
          만나는 선에 밝기 띠가 생긴다 — 렌더로 확인한 결함. 접지 그림자 하나로 충분하다.
        */}
        {products.map((p, i) => {
          const active = i === index;
          const cls = `ease-soft absolute transition-opacity duration-700 ${active ? "opacity-100" : "opacity-0"}`;
          return (
            <picture key={p.slug}>
              {/* md 이상: 촬영 원본 전체 채움 */}
              <source media="(min-width: 768px)" srcSet={p.images[0]} />
              <img
                src={p.cutout ?? p.images[0]}
                alt={active ? `${p.name ?? "제품"} 착용 컷` : ""}
                aria-hidden={!active}
                loading={i === 0 ? "eager" : "lazy"}
                // 첫 장은 LCP 후보다. 우선순위를 올려 CSS 보다 뒤로 밀리지 않게 한다. 나머지는 기본.
                fetchPriority={i === 0 ? "high" : undefined}
                className={`${cls} inset-x-0 bottom-[6%] mx-auto h-[86%] w-auto [filter:drop-shadow(0_18px_24px_rgba(16,2,6,0.5))] md:inset-0 md:bottom-auto md:h-full md:w-full md:object-cover md:object-top md:[filter:none]`}
              />
            </picture>
          );
        })}

        {/* 모바일 접지 그림자 — 누끼 발밑. 데스크톱은 사진이 제 그림자를 갖고 있다 */}
        <span
          aria-hidden="true"
          className="absolute bottom-[5%] left-1/2 h-[2.2%] w-[40%] -translate-x-1/2 rounded-[50%] bg-[rgba(10,1,4,0.45)] blur-[6px] md:hidden"
        />
        {/* 데스크톱 사진 안쪽 헤어라인 — 판과 사진의 경계가 종이 접힌 선처럼 읽힌다 */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] md:block"
        />
      </div>

      {/* ── 정보 판. 모바일은 벨벳 위 가운데, 데스크톱은 베이지 판 왼쪽 정렬 ── */}
      <div className="relative flex flex-col items-center justify-between overflow-hidden px-6 pb-6 pt-2 text-center md:bg-band md:items-stretch md:px-14 md:pb-12 md:pt-14 md:text-left">
        {/*
          모노그램은 뺐다. 금색은 이 사이트 팔레트 밖의 색이고(밝은 배경에서 1.7~2.1:1),
          같은 화면에 헤더 워드마크 · 하단 워드마크가 이미 있어 셋째 브랜드 표기는 군더더기였다.
          모노그램의 자리는 파비콘 · 행택 · 404 같은 작은 정사각 면이다.
        */}
        {/*
          제품 정보. aria-live 로 넘길 때마다 이름이 읽힌다.
          h1 은 페이지에 하나 — 대표 제품명이 곧 이 페이지의 제목이다.
        */}
        <div id={liveId} aria-live="polite" className="my-6 md:my-auto">
          <p className="text-accent text-2xs tracking-label">
            {CATEGORY_LABEL[product.category].en}
            <span aria-hidden="true"> · </span>
            {fit.ko}
          </p>
          {/*
            두 줄 높이를 미리 잡고 두 줄에서 자른다. 슬라이드를 넘길 때 이름 길이가 달라져
            버튼이 위아래로 밀리는 것(content jumping)을 막는다.
          */}
          <h1 className="font-display text-primary leading-display tracking-display mt-3 line-clamp-2 min-h-[2.4em] text-2xl md:mt-4 md:text-4xl lg:text-hero">
            {name}
          </h1>
          <p className="text-secondary mt-2 text-(length:--fs-base) tabular-nums md:mt-4 md:text-xl">
            {product.priceKrw !== null ? (
              <>{KRW.format(product.priceKrw)}원</>
            ) : (
              // D1 이 카탈로그+문의로 확정되면 이 표시가 정상 상태가 된다.
              <span className="text-secondary md:text-muted">가격 문의</span>
            )}
          </p>

          {/*
            주 버튼은 두 화면 모두 골드 채움이다. 예전에는 모바일만 크림 채움이었는데,
            그건 누끼가 **베이지 바탕** 위에 있던 시절의 규칙이다. 지금은 모바일도
            와인 면이라 골드가 그대로 산다 (와인 위 5.07:1).
            보조 버튼 테두리만 다르다 — border-strong 은 와인 위에서 묻힌다.
          */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:mt-8 md:justify-start">
            <Link
              href={`/products/${product.slug}`}
              className="group bg-accent text-on-accent hover:bg-accent-hover shadow-button hover:shadow-button-hover tracking-button ease-fluid inline-flex items-center gap-2 rounded-full py-2.5 pl-5 pr-1.5 text-xs transition-all duration-500 hover:-translate-y-px active:scale-[0.98] md:gap-3 md:py-3 md:pl-6 md:pr-2 md:text-sm"
            >
              자세히 보기
              <span className="bg-on-accent/12 ease-fluid flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-500 group-hover:-translate-y-px group-hover:translate-x-1 group-hover:scale-105 md:h-8 md:w-8">
                <ArrowUpRight size={11} weight="light" aria-hidden="true" />
              </span>
            </Link>
            <Link
              href="/products"
              className="tracking-button ease-fluid inline-flex items-center rounded-full border border-primary/45 px-5 py-2.5 text-xs text-primary transition-all duration-500 hover:border-primary active:scale-[0.98] md:border-strong md:text-primary md:hover:border-accent md:hover:text-accent md:hover:shadow-soft md:px-6 md:py-3 md:text-sm"
            >
              전체 제품
            </Link>
          </div>
        </div>

        {/*
          모바일: 넘기기(위) → 워드마크(맨 아래, 화면 폭보다 넓게 깔려 좌우가 살짝 잘린다 — 스케치대로).
          데스크톱: 워드마크(왼쪽) · 넘기기(오른쪽) 한 줄.
        */}
        <div className="flex w-full flex-col-reverse items-center gap-6 md:flex-row md:items-end md:justify-between">
          <div className="text-accent w-[112%] max-w-none md:text-accent-deep md:w-[min(60%,320px)]">
            <Logo fluid label="" />
          </div>

          {count > 1 && (
            <div className="flex items-center gap-2">
              <span
                className="text-on-accent/60 text-2xs tabular-nums md:text-muted"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
                <span className="mx-1 opacity-60">/</span>
                {String(count).padStart(2, "0")}
              </span>
              {/* 터치 타깃 44px. 아이콘만 있는 버튼이라 aria-label 이 곧 이름이다. */}
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="이전 제품"
                className="ease-fluid flex h-11 w-11 items-center justify-center rounded-full border border-primary/45 text-primary transition-all duration-300 hover:border-primary active:scale-[0.96] md:border-strong md:text-primary md:hover:border-accent md:hover:shadow-soft"
              >
                <ArrowLeft size={16} weight="light" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="다음 제품"
                className="ease-fluid flex h-11 w-11 items-center justify-center rounded-full border border-primary/45 text-primary transition-all duration-300 hover:border-primary active:scale-[0.96] md:border-strong md:text-primary md:hover:border-accent md:hover:shadow-soft"
              >
                <ArrowRight size={16} weight="light" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
