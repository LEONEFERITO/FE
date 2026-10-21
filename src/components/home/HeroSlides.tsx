"use client";

import { ArrowUpRight, CaretLeft, CaretRight, Pause, Play } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
 *
 * ── 이미지 한 장 장면 (2026-10-13 "히어로 전체를 이미지 하나로 덮게") ──────────
 * 사진이 바깥 무대 전체(헤더 아래까지)를 덮는다 — 누끼처럼 가운데 일정 면적이 아니다. 같은 이유로 위치 기준이 바깥 무대다.
 * 사진 밝기를 모르므로 위 · 아래에 어두운 그림자를 깔고 글자를 흰색으로 쓴다. 헤더도 이 장면 위에서는 밝은 글자가 된다
 * (히어로 요소의 data-hero-tone="dark" — components/layout/Header). 휴대폰은 세로 사진을 따로 받는다(없으면 큰 사진을 가운데로 잘라).
 *
 * ── 영상 장면 (2026-10-13 "영상 배너", 서버 V29) ──────────────────────────
 * 이미지 한 장과 같은 자리 · 글자에 사진 대신 영상이 소리 없이 반복 재생된다. 첫 장면 사진(포스터)을 먼저 깔고
 * 영상이 첫 화면을 그리면 그 위로 서서히 나타난다 — 영상을 받는 몇 초 동안 화면이 비지 않게.
 *   · 지금 장면일 때만 재생한다. 다른 장면은 처음 보일 때 받기 시작한다(첫 화면에 영상 여러 개를 받지 않게).
 *   · 휴대폰(768px 미만)은 휴대폰 영상이 있으면 그것 — 한 쪽만 받는다(<source media> 는 브라우저마다 달라 직접 고른다).
 *   · 움직임을 줄인 사용자는 재생하지 않는다(첫 장면만). 끝없이 움직이므로 멈춤 버튼을 둔다(WCAG 2.2.2).
 *   · 저전력 모드 등으로 자동 재생이 막히면 첫 장면 사진이 그대로 남는다.
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

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(media.matches);
    on();
    media.addEventListener("change", on);
    return () => media.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** 영상 — 지금 장면이고, 움직임을 줄이지 않았고, 멈추지 않았을 때만 재생 */
function CoverVideo({
  video,
  play,
  armed,
}: {
  video: { src: string; mobileSrc: string | null };
  play: boolean;
  /** 받기 시작해도 되는가 — 한 번 보인 장면부터 */
  armed: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  /** 첫 화면을 그린 영상 주소 — 주소가 바뀌면(휴대폰 ↔ PC) 다시 첫 장면 사진부터 */
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const ready = src !== null && readySrc === src;

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 767px)");
    const pick = () => setSrc(narrow.matches && video.mobileSrc ? video.mobileSrc : video.src);
    pick();
    narrow.addEventListener("change", pick);
    return () => narrow.removeEventListener("change", pick);
  }, [video.src, video.mobileSrc]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !src || !armed) return;
    if (play) {
      // 저전력 모드 · 데이터 절약 등으로 막히면 첫 장면 사진이 남는다
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [play, src, armed]);

  return (
    <video
      ref={ref}
      // 재생하지 않는 사용자(움직임 줄이기)도 첫 화면은 보이게 — #t 로 첫 장면을 그리게 한다
      src={armed && src ? `${src}#t=0.001` : undefined}
      muted
      loop
      playsInline
      disablePictureInPicture
      preload={armed ? (play ? "auto" : "metadata") : "none"}
      aria-hidden="true"
      tabIndex={-1}
      onLoadedData={() => setReadySrc(src)}
      className="ease-fluid absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 motion-reduce:transition-none"
      style={{ opacity: ready ? 1 : 0 }}
    />
  );
}

/** 이미지 한 장 · 영상 — 사진(영상)이 화면 전체를 덮고, 글자 · 버튼은 아래쪽. 글자를 비우면 버튼만 */
function ImageSlide({ slide, first, active }: { slide: HeroSlide; first: boolean; active: boolean }) {
  const cover = slide.cover!;
  const video = cover.video ?? null;
  const reduced = useReducedMotion();
  const [stopped, setStopped] = useState(false);
  // 한 번 보인 장면부터 영상을 받는다 — 뒤 장면들의 영상까지 첫 화면에서 받지 않게
  const [armed, setArmed] = useState(active);
  if (active && !armed) setArmed(true);
  return (
    <>
      {cover.src ? (
        <picture className="absolute inset-0 block">
          {cover.mobileSrc && <source media="(max-width: 767px)" srcSet={cover.mobileSrc} />}
          <img
            src={cover.src}
            alt={cover.alt}
            loading={first ? "eager" : "lazy"}
            fetchPriority={first ? "high" : "auto"}
            className="h-full w-full object-cover"
          />
        </picture>
      ) : (
        // 첫 장면 사진이 없는 영상 — 영상이 올 때까지 어두운 바탕. 설명은 화면 낭독기에만
        <div className="bg-primary absolute inset-0">
          <span className="sr-only">{cover.alt}</span>
        </div>
      )}
      {video && <CoverVideo video={video} play={active && !reduced && !stopped} armed={armed} />}
      {/* 위(헤더 · 첫 줄)와 아래(제목 · 버튼) 글자가 어떤 사진 위에서도 읽히게 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.62) 100%)",
        }}
      />
      {/*
        여백은 디자이너 피그마 수치 (2026-10-20 영상): 화면 왼쪽에서 94(무대 padding 40 + 54), 아래에서 82(무대 padding 40 + 42).
        2026-10-21 디자이너: 작은 줄 · 로고 · 설명을 한 묶음으로 — 작은 줄은 로고 위 10, 설명은 로고 아래 43. 작은 줄은 자간을 넓히지 않는다.
        설명은 관리자가 엔터로 나눈 그대로(PC, whitespace-pre-line) — 폭은 그 줄이 들어가게 넓혔다(570 → 960). 폰은 자동 줄바꿈 · 가운데 정렬.
      */}
      <div
        data-quick-avoid=""
        className="relative z-20 mt-auto flex flex-col items-center pb-2 text-center md:ml-[54px] md:max-w-[960px] md:items-start md:pb-[42px] md:pl-0 md:text-left"
      >
        {/* 글자는 전부 흰색 (2026-10-17 디자이너 요청 "히어로 텍스트 화이트로 통일") — 작은 줄도 골드가 아니다 */}
        {slide.eyebrow && <p className="text-2xs text-white md:text-[16px]">{slide.eyebrow}</p>}
        {slide.title && (
          <p className="font-display tracking-display mt-2 line-clamp-2 text-2xl leading-none text-white md:mt-[10px] md:text-4xl lg:text-[52px]">
            {slide.title}
          </p>
        )}
        {slide.subtitle && (
          <p className="mt-2 text-sm text-white md:mt-[43px] md:text-[18px] md:font-medium md:leading-[30px] md:whitespace-pre-line">
            {slide.subtitle}
          </p>
        )}
        {/* 버튼 줄. 영상이면 옆에 멈춤 버튼 — 끝없이 움직이는 화면은 멈출 수 있어야 한다(WCAG 2.2.2).
            글자 블록 안에 둔다: 화면 오른쪽 아래는 떠 있는 퀵메뉴 자리라 거기 두면 눌리지 않는다.
            움직임을 줄인 사용자에게는 처음부터 멈춰 있어 감춘다 */}
        {/* 버튼은 관리자가 켠 배너에만(slide.primary, V35). 영상 멈춤 버튼은 버튼과 상관없이 있다 */}
        <div className={`flex items-center gap-3 ${slide.primary || (video && !reduced) ? "mt-5 md:mt-7" : ""}`}>
          {slide.primary && (
            <Primary
              href={slide.primary.href}
              className="group bg-accent text-on-accent hover:bg-accent-hover tracking-button ease-fluid inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-1.5 text-xs transition-all duration-500 hover:-translate-y-px active:scale-[0.98] md:h-12 md:gap-3 md:pl-6 md:pr-2 md:text-sm"
            >
              {slide.primary.label}
              <span className="bg-on-accent/12 ease-fluid flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-500 group-hover:-translate-y-px group-hover:translate-x-1 group-hover:scale-105 md:h-8 md:w-8">
                <ArrowUpRight size={11} weight="light" aria-hidden="true" />
              </span>
            </Primary>
          )}
          {video && !reduced && (
            <button
              type="button"
              onClick={() => setStopped((s) => !s)}
              aria-label={stopped ? "배너 영상 재생" : "배너 영상 멈춤"}
              aria-pressed={stopped}
              className="ease-fluid inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white transition-colors duration-300 hover:border-white focus-visible:border-white md:h-12 md:w-12"
            >
              {stopped ? <Play size={13} weight="light" aria-hidden="true" /> : <Pause size={13} weight="light" aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>
    </>
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
        {/* 주 버튼은 관리자가 켠 배너에만(V35). 「전체 제품」은 그대로 */}
        {slide.primary && (
          <Primary
            href={slide.primary.href}
            className="group bg-accent text-on-accent hover:bg-accent-hover shadow-button hover:shadow-button-hover tracking-button ease-fluid inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-1.5 text-xs transition-all duration-500 hover:-translate-y-px active:scale-[0.98] md:h-12 md:gap-3 md:pl-6 md:pr-2 md:text-sm"
          >
            {slide.primary.label}
            <span className="bg-on-accent/12 ease-fluid flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-500 group-hover:-translate-y-px group-hover:translate-x-1 group-hover:scale-105 md:h-8 md:w-8">
              <ArrowUpRight size={11} weight="light" aria-hidden="true" />
            </span>
          </Primary>
        )}
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
  /** 지금 장면이 사진 한 장이면 위 글자 · 버튼 · 헤더를 밝게 */
  const dark = slides[current]?.layout === "image";
  const button = `${
    dark ? "text-white" : "text-secondary hover:text-accent focus-visible:text-accent"
  } ease-fluid inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300`;

  // 헤더에 알린다 — 히어로 요소의 표식을 바꾸면 헤더가 글자색을 바꾼다(Header 의 MutationObserver)
  useEffect(() => {
    const hero = document.querySelector("[data-hero]");
    hero?.setAttribute("data-hero-tone", dark ? "dark" : "light");
  }, [dark]);

  return (
    <>
      {/*
        이 페이지의 유일한 h1. 화면에서는 뺐다(2026-10-17 디자이너 요청 "이 텍스트 없애주고") — 검색 · 화면 낭독기에는
        페이지 제목으로 남긴다. 눈에 보이는 첫 줄이 없어진 만큼 장면의 큰 제목이 첫 글자가 된다.
      */}
      <h1 className="sr-only">운동으로 달라진 체형을 위한 남성 기성복</h1>

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
              {slide.layout === "image" ? (
                <ImageSlide slide={slide} first={i === 0} active={on} />
              ) : (
                <Slide slide={slide} first={i === 0} />
              )}
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
          <span
            className={`text-2xs tracking-label min-w-[4.5rem] text-center tabular-nums ${dark ? "text-white" : "text-secondary"}`}
            aria-live={running ? "off" : "polite"}
          >
            <span className={dark ? "text-white" : "text-primary"}>{pad(current + 1)}</span> / {pad(count)}
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
