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
 */
export function WhyScroll({
  content,
  fallbackImage,
}: {
  content: WhyContent;
  /** 사진이 없는 항목에 쓸 기본 배경. 파일이 없으면 null — 바탕색만 남는다. */
  fallbackImage: string | null;
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
      const range = rect.height - window.innerHeight;
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

  return (
    <section
      ref={sectionRef}
      aria-labelledby="why-heading"
      className="why-pin bg-band border-subtle border-y"
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
                data-active={i === active}
                className="why-bg absolute inset-0 h-full w-full object-cover object-right md:object-center"
              />
            );
          })}
          {/* 가림막 — 글자 쪽을 바탕색으로 지킨다. 색은 섹션 바탕과 같은 토큰이라 사진이 종이에서 배어나오듯 이어진다. */}
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
        </div>

        <div className="relative mx-auto flex h-full max-w-[1320px] flex-col justify-end px-5 pb-12 pt-[96px] md:justify-center md:px-15 md:pb-16 md:pt-[104px]">
          {/* 글자는 가림막의 불투명 구간 안에만 둔다 */}
          <div className="md:max-w-[520px]">
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <h2
              id="why-heading"
              className="font-display text-primary leading-display tracking-display mt-4 text-3xl md:text-4xl"
            >
              {content.title}
            </h2>
            <p className="text-secondary mt-5 hidden text-(length:--fs-base) md:block">{content.intro}</p>

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
