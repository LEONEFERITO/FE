"use client";

import { useEffect, useRef, useState } from "react";

import { Eyebrow } from "@/components/ui/Eyebrow";
import type { WhyContent } from "@/lib/why";

/**
 * 왜 LEONE FERITO 인가 — 화면을 붙잡아 두고 스크롤로 넘기는 구간 (2026-10-02, 고객 레퍼런스 영상).
 *
 * ── 어떻게 움직이나 ─────────────────────────────────────
 * 바깥 래퍼는 (항목 수 + 1) 화면 높이고, 안쪽 무대는 sticky 로 붙어 한 화면에 머문다.
 * 래퍼를 지나는 스크롤량이 곧 진행도다 — 한 화면만큼 내릴 때마다 다음 항목이 켜진다.
 * 켜진 항목은 제목이 또렷해지고 설명이 펼쳐지며, 그 항목의 배경 사진이 서서히 바뀐다(crossfade).
 * 제목을 누르면 그 항목 자리로 스크롤한다.
 *
 * 스크롤 이벤트는 구간이 화면에 있을 때만 듣고(IntersectionObserver), 프레임마다 한 번만 계산한다(rAF).
 * 움직이는 건 opacity 와 grid-template-rows 뿐이다 — top · height 를 매 프레임 바꾸지 않는다.
 *
 * ── JS 가 없거나 움직임을 줄인 사용자 ───────────────────
 * 핀을 걸지 않고 한 화면짜리 구간으로 둔다 — 항목 전부가 설명과 함께 펼쳐진 채 보인다.
 * (globals.css 의 .why-pin · .why-stage · .why-body — html[data-motion="on"] 일 때만 핀)
 *
 * ── 글자 대비 ───────────────────────────────────────────
 * 사진이 밝을 수도 어두울 수도 있어서(관리자가 올린다) 글자 쪽은 가림막으로 지킨다:
 * 데스크톱은 왼쪽을 바탕색으로 덮고 오른쪽으로 걷어낸다, 모바일은 아래를 덮고 위로 걷어낸다.
 * 글자는 그 불투명 구간 안에만 둔다.
 *
 * ── 메인의 첫 화면일 때 (`hero`, 2026-10-05 고객 디자인 가이드) ────────────
 * 가이드의 첫 화면은 "모델 단체 사진 위에 이 구간의 글자 판이 얹힌 모습" 이다. 그래서 같은 구간을
 * 히어로로도 쓴다. 달라지는 것:
 *   · 제목이 h1 이 된다 — 페이지에 h1 은 하나고, 첫 화면의 제목이 그 자리다.
 *   · 가림막(그라데이션) 대신 **불투명한 판**에 글자를 담는다. 사진이 판 둘레로 온전히 보이고,
 *     글자 대비는 사진이 무엇이든 판이 지킨다(가이드의 크림 사각형).
 *   · 헤더 높이만큼 끌어올려 첫 화면이 정확히 한 화면이 되게 한다. data-hero 표식도 붙인다.
 * 사진은 관리자가 WHY 항목마다 올리는 배경이다(V18) — 단체 사진을 올리면 그대로 히어로 사진이 된다.
 * TODO(고객확인) 히어로용 모델 단체 사진.
 */
export function WhyScroll({
  content,
  fallbackImage,
  hero = false,
  panel = false,
}: {
  content: WhyContent;
  /** 사진이 없는 항목에 쓸 기본 배경. 파일이 없으면 null — 바탕색만 남는다. */
  fallbackImage: string | null;
  /** 메인의 첫 화면으로 쓴다 (위 머리말). 제목이 h1 이 되고 헤더 밑으로 끌어올린다. 판 모양은 따라온다. */
  hero?: boolean;
  /**
   * 글자를 **불투명한 판**에 담는다 — 가이드가 그린 "사진 위 크림 사각형" 모양.
   * 첫 화면이 아니어도 이 모양만 쓸 수 있다: 2026-10-05 에 첫 화면은 배너(HeroReveal)로 정해졌고,
   * 이 구간은 그 바로 아래에서 판 모양으로 선다. 그때 제목은 h2 다(h1 은 배너가 갖는다).
   */
  panel?: boolean;
}) {
  const items = content.items;
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (document.documentElement.dataset.motion !== "on") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      // 무대(sticky) 높이로 잰다 — innerHeight 는 모바일 주소창이 접힐 때마다 바뀐다
      const stageH = (el.firstElementChild as HTMLElement | null)?.offsetHeight || window.innerHeight;
      const range = rect.height - stageH;
      if (range <= 0) return;
      const progress = Math.min(1, Math.max(0, -rect.top / range));
      setActive(Math.min(items.length - 1, Math.floor(progress * items.length)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.addEventListener("scroll", onScroll, { passive: true });
          update();
        } else {
          window.removeEventListener("scroll", onScroll);
        }
      },
      { rootMargin: "20% 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items.length]);

  function jumpTo(index: number) {
    const el = sectionRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: top + index * window.innerHeight + 1, behavior: reduce ? "auto" : "smooth" });
  }

  // 태그만 바뀐다. 히어로일 때 이 제목이 페이지의 h1 이다.
  const Heading = hero ? "h1" : "h2";
  // 판 모양인가. 히어로는 언제나 판이고, 판은 히어로가 아니어도 된다.
  const boxed = hero || panel;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="why-heading"
      data-hero={hero ? "" : undefined}
      /*
        히어로일 때의 음수 마진은 헤더 높이(h-14 / md:h-18)다. 헤더가 sticky(= 흐름 안)라 그냥 두면
        첫 화면이 "헤더 + 한 화면" 이 되어 글자 판의 아래가 잘린 채 시작한다.
      */
      className={`why-pin bg-band border-subtle border-y ${hero ? "-mt-14 md:-mt-18" : ""}`}
      style={{ "--why-steps": items.length + 1 } as React.CSSProperties}
    >
      <div className="why-stage relative overflow-hidden">
        {/* 배경 — 항목마다 한 장, 켜진 것만 보인다. 장식이라 alt 는 비운다(글자가 내용을 전한다). */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {items.map((item, i) => {
            const src = item.imageUrl ?? fallbackImage;
            if (!src) return null;
            return (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={`${i}-${src}`}
                src={src}
                alt=""
                loading={i === 0 ? "eager" : "lazy"}
                // 히어로의 첫 장은 첫 화면에서 가장 큰 그림(LCP 후보)이다.
                fetchPriority={hero && i === 0 ? "high" : undefined}
                data-active={i === active}
                className={`why-bg absolute inset-0 h-full w-full object-cover ${
                  /*
                    어디를 기준으로 자를지는 **사진이 누구 것이냐**로 정한다.
                    기본 사진(테일러링 컷)은 인물이 오른쪽 끝에 있다 — 좁은 화면에서 가운데를 자르면 빈 벽만 남는다
                    (히어로로 올린 직후 실제로 그랬다). 그래서 좁은 화면에서는 오른쪽을 본다.
                    관리자가 올린 사진은 히어로일 때 가운데를 본다 — 인물이 가운데 모인 단체 컷을 전제로 한다.
                  */
                  boxed && item.imageUrl ? "object-center" : "object-right md:object-center"
                }`}
              />
            );
          })}
          {/* 가림막 — 글자 쪽을 바탕색으로 지킨다. 판 모양은 불투명한 판이 그 일을 하므로 걷는다. */}
          {!boxed && (
            <>
              <div
                className="absolute inset-0 hidden md:block"
                style={{
                  background:
                    "linear-gradient(to right, var(--bg-subtle) 0%, var(--bg-subtle) 42%, color-mix(in srgb, var(--bg-subtle) 82%, transparent) 56%, color-mix(in srgb, var(--bg-subtle) 42%, transparent) 70%, color-mix(in srgb, var(--bg-subtle) 12%, transparent) 86%, transparent 96%)",
                }}
              />
              <div
                className="absolute inset-0 md:hidden"
                style={{
                  background:
                    "linear-gradient(to top, var(--bg-subtle) 0%, var(--bg-subtle) 46%, color-mix(in srgb, var(--bg-subtle) 80%, transparent) 60%, color-mix(in srgb, var(--bg-subtle) 30%, transparent) 78%, transparent 100%)",
                }}
              />
            </>
          )}
        </div>

        <div
          className={`relative mx-auto flex h-full max-w-[1320px] flex-col justify-end px-5 pt-[96px] md:justify-center md:px-15 md:pb-16 md:pt-[104px] ${
            // 판 모양: 모바일에서 판이 화면 바닥까지 닿는다 — 판 아래로 사진 띠가 남으면 판이 떠 보인다
            boxed ? "pb-0" : "pb-12"
          }`}
        >
          {/*
            글자는 가림막의 불투명 구간 안에만 둔다.
            히어로는 판 자체가 불투명하다: 모바일은 좌우 끝까지(-mx-5) 닿는 바닥 판, 데스크톱은 왼쪽에 얹힌 판.
          */}
          <div
            className={
              boxed
                ? "bg-band -mx-5 px-5 pb-10 pt-7 md:mx-0 md:max-w-[600px] md:px-11 md:py-11 md:shadow-lift"
                : "md:max-w-[520px]"
            }
          >
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <Heading
              id="why-heading"
              className="font-display text-primary leading-display tracking-display mt-4 text-3xl md:text-4xl"
            >
              {content.title}
            </Heading>
            {/* pre-line: 문구의 줄바꿈을 그대로 살린다. 문장 단위로 끊어 읽히게 하려는 것(2026-10-05 가이드) */}
            <p className="text-secondary mt-5 hidden whitespace-pre-line text-(length:--fs-base) md:block">
              {content.intro}
            </p>

            <ol className="mt-8 flex flex-col md:mt-12">
              {items.map((item, i) => {
                const on = i === active;
                return (
                  <li key={i} data-active={on} className="why-item border-subtle border-t">
                    <button
                      type="button"
                      onClick={() => jumpTo(i)}
                      aria-current={on ? "step" : undefined}
                      className="ease-fluid flex min-h-12 w-full items-baseline gap-5 py-3 text-left transition-colors duration-500 md:py-4"
                    >
                      <span className={`text-2xs tracking-label tabular-nums ${on ? "text-accent" : "text-muted"}`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`font-display ease-fluid transition-[color,opacity] duration-500 ${
                          on ? "text-primary text-xl md:text-2xl" : "text-primary/55 text-lg md:text-xl"
                        }`}
                      >
                        {item.title}
                      </span>
                    </button>
                    <div className="why-body">
                      <div className="min-h-0 overflow-hidden">
                        <p className="text-secondary pb-5 pl-9 text-sm leading-relaxed md:pb-6 md:text-(length:--fs-base)">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
