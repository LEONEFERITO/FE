"use client";

import { ArrowUpRight, CaretLeft, CaretRight, Pause, Play } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { DetailCut, HeroSlide } from "@/lib/heroSlide";

/**
 * 메인 배너의 장면들 — 여러 장이면 6초마다 넘어간다 (2026-10-12 "배너 리스트").
 *
 * ── 언제 넘기나 ──────────────────────────────────────────
 * 맨 위에 있을 때만. 스크롤을 시작하면 그 장면의 액자가 아래에서 올라온다 — 그 도중에 장면이 바뀌면
 * 어느 사진이 어느 상품인지 흐트러진다(HeroReveal 머리말 "넘기기"). 그래서 스크롤을 내리면 멈추고,
 * 맨 위로 돌아오면 다시 넘어간다. 마우스를 올리거나 버튼에 초점이 있어도 멈춘다 — 읽는 중에 바뀌지 않게.
 * 움직임을 줄인 사용자는 저절로 넘어가지 않는다(버튼으로만).
 *
 * ── 겹쳐 놓는다 ──────────────────────────────────────────
 * 장면들은 한 칸(grid 1×1)에 겹쳐 있고 지금 장면만 보인다. 자리를 바꾸지 않아 넘어갈 때 화면이 흔들리지 않는다.
 * 숨은 장면은 inert — 초점 · 화면 낭독기가 닿지 않는다. 칸은 위치 기준(relative)이 아니다:
 * 데스크톱의 이름 · 버튼 블록은 바깥 무대(HeroReveal)를 기준으로 놓인다.
 */

const INTERVAL_MS = 6000;

function Frame({ cut, side, className }: { cut: DetailCut; side: "l" | "r"; className: string }) {
  return (
    <figure
      className={`hero-reveal-card hero-reveal-card-${side} bg-surface shadow-lift absolute aspect-[4/5] overflow-hidden p-1 md:p-1.5 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cut.src}
        alt={cut.alt}
        loading="eager"
        className="block h-full w-full object-cover"
        style={{ objectPosition: cut.position }}
      />
    </figure>
  );
}

/** 사이트 밖 주소(https://…)는 새 창으로 — 둘러보던 사람이 사이트를 잃지 않게 */
function Primary({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  return /^https?:\/\//.test(href) ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span className="sr-only">(새 창)</span>
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function Slide({ slide, first }: { slide: HeroSlide; first: boolean }) {
  const [left, right] = slide.frames;
  return (
    <>
      {/*
        이름 · 가격. 모바일은 h1 아래 가운데(인물과 겹치지 않게 무대 **밖**),
        데스크톱은 무대 왼쪽 중단 — 레퍼런스의 "사구싶은 가격" 자리. 인물과 액자 사이 여백이 넓다.
      */}
      <div className="relative z-20 mt-4 text-center md:absolute md:left-10 md:top-1/2 md:mt-0 md:max-w-[320px] md:-translate-y-[62%] md:text-left lg:left-[7%]">
        {slide.eyebrow && <p className="text-accent text-2xs tracking-label">{slide.eyebrow}</p>}
        {slide.title && (
          <p className="font-display text-primary leading-display tracking-display mt-2 line-clamp-2 text-xl md:mt-3 md:text-3xl lg:text-4xl">
            {slide.title}
          </p>
        )}
        {slide.subtitle && <p className="text-secondary mt-1.5 text-sm tabular-nums md:mt-3 md:text-lg">{slide.subtitle}</p>}
      </div>

      {/* ── 무대. 인물 + 액자 둘. 남는 높이를 전부 쓴다 ──────────── */}
      <div className="relative z-10 mx-auto mt-4 min-h-0 w-full max-w-[1320px] flex-1 md:mt-0">
        {/* 인물 — 처음부터 있다. 그림자 · 발밑 타원은 걷었다(2026-10-06 그림자 전부 제거) */}
        <div className="absolute inset-x-0 bottom-0 flex h-full justify-center">
          {/* 넓은 사진을 올려도 무대 폭을 넘지 않게 — 비율은 그대로, 바닥에 붙인다 */}
          <div className="relative h-full max-w-full">
            {slide.figure && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={slide.figure.src}
                alt={slide.figure.alt}
                loading={first ? "eager" : "lazy"}
                // 첫 화면의 가장 큰 그림 = LCP 후보. CSS 뒤로 밀리지 않게 우선순위를 올린다.
                fetchPriority={first ? "high" : "auto"}
                className="relative block h-full w-auto max-w-full object-contain object-bottom"
              />
            )}
          </div>
        </div>

        {/* 액자 왼쪽 아래 · 오른쪽 위. 인물과 조금 겹친다 — 레퍼런스대로 */}
        {/* 모바일 폭은 레퍼런스 비율(화면의 약 1/3)에 맞췄다. 더 키우면 인물의 무릎·팔이 액자에 묻힌다 */}
        <Frame cut={left} side="l" className="bottom-[6%] left-0 w-[36%] md:bottom-[10%] md:left-[18%] md:w-[19%] lg:left-[22%]" />
        <Frame cut={right} side="r" className="right-0 top-[4%] w-[32%] md:right-[18%] md:top-[8%] md:w-[17%] lg:right-[22%]" />

        {/* 오른쪽 아래 캡션 — 레퍼런스의 "26FW 가을 아우터". 좁은 화면에서는 신발과 겹쳐 뺀다 */}
        <p className="text-secondary absolute bottom-0 right-0 hidden text-right text-xs leading-relaxed md:block lg:right-[4%]">
          <span className="font-display text-primary block text-lg">LEONE FERITO</span>
          {slide.captionSub}
        </p>
      </div>

      {/* 이름 블록과 버튼은 무대(z-10)보다 위(z-20) — 넓은 사진을 올려도 글자가 묻히지 않는다 */}
      {/* 문 두 개. 모바일은 무대 아래 가운데, 데스크톱은 이름 블록 아래 왼쪽. 높이를 같게 고정한다(2026-10-06 요청) */}
      <div
        data-quick-avoid=""
        className="relative z-20 mt-5 flex flex-wrap items-center justify-center gap-3 md:absolute md:bottom-10 md:left-10 md:mt-0 md:justify-start lg:left-[7%]"
      >
        <Primary
          href={slide.primary.href}
          className="group bg-accent text-on-accent hover:bg-accent-hover shadow-button hover:shadow-button-hover tracking-button ease-fluid inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-1.5 text-xs transition-all duration-500 hover:-translate-y-px active:scale-[0.98] md:h-12 md:gap-3 md:pl-6 md:pr-2 md:text-sm"
        >
          {slide.primary.label}
          <span className="bg-on-accent/12 ease-fluid flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-500 group-hover:-translate-y-px group-hover:translate-x-1 group-hover:scale-105 md:h-8 md:w-8">
            <ArrowUpRight size={11} weight="light" aria-hidden="true" />
          </span>
        </Primary>
        <Link
          href="/products"
          className="tracking-button ease-fluid border-strong hover:border-accent hover:text-accent hover:shadow-soft inline-flex h-11 items-center rounded-full border px-5 text-xs text-primary transition-all duration-500 active:scale-[0.98] md:h-12 md:px-6 md:text-sm"
        >
          전체 제품
        </Link>
      </div>
    </>
  );
}

export function HeroSlides({ slides, autoplay = true }: { slides: HeroSlide[]; autoplay?: boolean }) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (count < 2) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMedia = () => setReduced(media.matches);
    const onScroll = () => setScrolled(window.scrollY > 24);
    onMedia();
    onScroll();
    media.addEventListener("change", onMedia);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      media.removeEventListener("change", onMedia);
      window.removeEventListener("scroll", onScroll);
    };
  }, [count]);

  const running = autoplay && count > 1 && !paused && !hovered && !focused && !scrolled && !reduced;

  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => window.clearTimeout(t);
  }, [running, index, count]);

  const current = Math.min(index, count - 1);
  const go = (next: number) => setIndex((next + count) % count);
  const pad = (n: number) => String(n).padStart(2, "0");
  const button =
    "text-secondary hover:text-accent focus-visible:text-accent ease-fluid inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300";

  return (
    <>
      <div
        role={count > 1 ? "region" : undefined}
        aria-roledescription={count > 1 ? "carousel" : undefined}
        aria-label={count > 1 ? "메인 배너" : undefined}
        className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1"
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
        }}
      >
        {slides.map((slide, i) => {
          const on = i === current;
          return (
            <div
              key={i}
              role={count > 1 ? "group" : undefined}
              aria-roledescription={count > 1 ? "slide" : undefined}
              aria-label={count > 1 ? `${i + 1} / ${count}` : undefined}
              aria-hidden={on ? undefined : true}
              inert={!on}
              className="ease-fluid col-start-1 row-start-1 flex min-h-0 flex-col transition-opacity duration-700 motion-reduce:transition-none"
              style={{ opacity: on ? 1 : 0, zIndex: on ? 1 : 0, pointerEvents: on ? undefined : "none" }}
            >
              <Slide slide={slide} first={i === 0} />
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div
          className="relative z-10 mt-1 flex items-center justify-center gap-1 md:absolute md:right-10 md:top-[104px] md:mt-0 lg:right-[4%]"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          <button type="button" onClick={() => go(current - 1)} aria-label="이전 배너" className={button}>
            <CaretLeft size={14} weight="light" aria-hidden="true" />
          </button>
          <span className="text-secondary text-2xs tracking-label min-w-[4.5rem] text-center tabular-nums" aria-live={running ? "off" : "polite"}>
            <span className="text-primary">{pad(current + 1)}</span> / {pad(count)}
          </span>
          <button type="button" onClick={() => go(current + 1)} aria-label="다음 배너" className={button}>
            <CaretRight size={14} weight="light" aria-hidden="true" />
          </button>
          {autoplay && !reduced && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "배너 넘기기 다시 시작" : "배너 넘기기 멈춤"}
              aria-pressed={paused}
              className={button}
            >
              {paused ? <Play size={13} weight="light" aria-hidden="true" /> : <Pause size={13} weight="light" aria-hidden="true" />}
            </button>
          )}
        </div>
      )}
    </>
  );
}
