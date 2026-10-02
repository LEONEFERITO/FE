"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * 스크롤 장면 — 구간을 지나는 스크롤량을 0~1 진행도로 바꿔 CSS 변수 `--p` 로 넘긴다.
 *
 * 연출 자체는 CSS 가 한다 (globals.css 의 .brand-* 규칙). 이 컴포넌트는 숫자만 쓴다.
 * 그래서 프레임마다 React 가 다시 그리지 않고, 움직이는 값은 transform · opacity 뿐이다.
 *
 * ── 두 가지 진행도 ───────────────────────────────────────
 *   pin  : 바깥 래퍼가 `--scene-h` 높이고 안쪽 무대(.scene-stage)가 sticky 로 한 화면에 머문다.
 *          래퍼를 지나는 스크롤량이 진행도다 — 메인 WHY 구간과 같은 방식.
 *   view : 구간이 화면 아래에서 들어와(0) 위로 빠져나갈 때까지(1). 지나가며 움직이는 패럴랙스용.
 *
 * ── 관성 ────────────────────────────────────────────────
 * 진행도는 스크롤을 1:1 로 따르지 않고 프레임마다 남은 거리의 일부만 따라간다(lerp).
 * 스크롤이 멈춘 뒤에도 0.3초쯤 미끄러져 들어가서 무게가 느껴진다 — 네이티브 스크롤은 그대로 둔다
 * (스크롤 자체를 가로채는 방식은 키보드 · 찾기 · 앵커를 전부 망가뜨린다).
 * 구간을 빠르게 지나쳐 화면 밖으로 나가면 미끄러지지 않고 0 또는 1 로 바로 맞춘다.
 *
 * ── 포인터 ───────────────────────────────────────────────
 * `pointer` 를 켜면 마우스 위치를 `--mx` · `--my`(-1~1)로 넘긴다. 마우스가 있는 기기에서만.
 * 히어로 층들이 이 값에 서로 다른 계수(--kx · --ky)를 곱해 깊이감을 낸다.
 *
 * ── JS 가 없거나 움직임을 줄인 사용자 ───────────────────
 * 핀을 걸지 않고 `--p` 도 쓰지 않는다. CSS 가 그 경우를 **완성된 상태**로 그린다
 * (html[data-motion="on"] 일 때만 숨기고, prefers-reduced-motion 에서는 되돌린다).
 */
export function Scene({
  as = "section",
  pin = false,
  height = "200vh",
  track = pin ? "pin" : "view",
  pointer = false,
  className = "",
  stageClassName = "",
  style,
  children,
  ...rest
}: {
  as?: "section" | "div" | "figure";
  /** 안쪽 무대를 한 화면에 붙잡아 둔다. */
  pin?: boolean;
  /** pin 일 때 래퍼 높이. 길수록 한 장면에 머무는 스크롤이 길다. */
  height?: string;
  track?: "pin" | "view";
  /** 마우스 위치를 --mx · --my 로 넘긴다. */
  pointer?: boolean;
  className?: string;
  stageClassName?: string;
  style?: CSSProperties;
  children: ReactNode;
} & Pick<React.HTMLAttributes<HTMLElement>, "aria-labelledby" | "aria-label" | "id">) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.documentElement.dataset.motion !== "on") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = { p: 0, mx: 0, my: 0 };
    const cur = { p: 0, mx: 0, my: 0 };
    const written = { p: "", mx: "", my: "" };
    let frame = 0;
    let fresh = true;

    const write = () => {
      const p = cur.p.toFixed(4);
      if (p !== written.p) {
        written.p = p;
        el.style.setProperty("--p", p);
      }
      if (!pointer) return;
      const mx = cur.mx.toFixed(3);
      const my = cur.my.toFixed(3);
      if (mx !== written.mx || my !== written.my) {
        written.mx = mx;
        written.my = my;
        el.style.setProperty("--mx", mx);
        el.style.setProperty("--my", my);
      }
    };

    // 프레임마다 남은 거리의 일부만 따라간다. 진행도는 조금 빠르게, 포인터는 더 느긋하게.
    const tick = () => {
      frame = 0;
      let moving = false;
      for (const k of ["p", "mx", "my"] as const) {
        const d = target[k] - cur[k];
        if (Math.abs(d) > 0.0005) {
          cur[k] += d * (k === "p" ? 0.14 : 0.08);
          moving = true;
        } else {
          cur[k] = target[k];
        }
      }
      write();
      if (moving) frame = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw =
        track === "pin" ? -rect.top / (rect.height - vh) : (vh - rect.top) / (vh + rect.height);
      target.p = Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 0;
    };
    const onScroll = () => {
      measure();
      if (fresh) {
        // 페이지를 중간에서 열었을 때(새로고침 · 뒤로가기)는 미끄러지지 않고 바로 맞춘다
        fresh = false;
        cur.p = target.p;
      }
      kick();
    };
    const onPointer = (e: PointerEvent) => {
      target.mx = (e.clientX / window.innerWidth - 0.5) * 2;
      target.my = (e.clientY / window.innerHeight - 0.5) * 2;
      kick();
    };
    const onLeave = () => {
      target.mx = 0;
      target.my = 0;
      kick();
    };
    const usePointer = pointer && window.matchMedia("(pointer: fine)").matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.addEventListener("scroll", onScroll, { passive: true });
          window.addEventListener("resize", onScroll);
          if (usePointer) {
            el.addEventListener("pointermove", onPointer, { passive: true });
            el.addEventListener("pointerleave", onLeave);
          }
          onScroll();
        } else {
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
          el.removeEventListener("pointermove", onPointer);
          el.removeEventListener("pointerleave", onLeave);
          // 화면 밖 — 미끄러질 이유가 없다. 끝 상태로 바로.
          measure();
          cur.p = target.p;
          cur.mx = target.mx = 0;
          cur.my = target.my = 0;
          if (frame) cancelAnimationFrame(frame);
          frame = 0;
          write();
        }
      },
      { rootMargin: "25% 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      el.removeEventListener("pointermove", onPointer);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [track, pointer]);

  // 태그만 바뀌고 속성은 같다. 타입은 section 으로 고정해 둔다 — div · figure 도 같은 HTMLElement 라 ref 가 맞는다.
  const Tag = as as "section";

  return (
    <Tag
      ref={ref}
      className={`scene ${className}`}
      data-pin={pin ? "" : undefined}
      style={{ "--scene-h": height, ...style } as CSSProperties}
      {...rest}
    >
      {pin ? <div className={`scene-stage ${stageClassName}`}>{children}</div> : children}
    </Tag>
  );
}
