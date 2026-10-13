"use client";

import { Desktop, DeviceMobile } from "@phosphor-icons/react/dist/ssr";
import { useCallback, useEffect, useRef, useState } from "react";

import { PREVIEW_READY, PREVIEW_SLIDE, type PreviewMessage } from "@/lib/bannerPreview";
import type { HeroSlide } from "@/lib/heroSlide";

/**
 * 메인 배너 미리보기 — PC 창(1440×900)과 모바일 창(390×844)을 실제 크기로 열고 화면에 맞게 줄여 보여 준다.
 *
 * 창 안쪽은 손님 화면과 같은 컴포넌트(HeroReveal)다. 관리자가 고치는 대로(저장 전에도) 바로 바뀐다.
 * 스크롤 장면이라 두 상태를 고른다: 처음 화면(인물 · 이름 · 버튼) / 스크롤 뒤(액자 둘이 올라온 화면).
 * 창은 누를 수 없다 — 미리보기 안의 링크로 관리자 화면을 떠나지 않게.
 */

const DEVICES = [
  { key: "pc", label: "PC", width: 1440, height: 900, Icon: Desktop },
  { key: "mo", label: "모바일", width: 390, height: 844, Icon: DeviceMobile },
] as const;

function Device({
  label,
  width,
  height,
  Icon,
  slide,
  progress,
  className,
}: {
  label: string;
  width: number;
  height: number;
  Icon: typeof Desktop;
  slide: HeroSlide | null;
  progress: number;
  className: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0);

  // 창을 칸 폭에 맞게 줄인다
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  const send = useCallback(() => {
    const msg: PreviewMessage = { type: PREVIEW_SLIDE, slide, progress };
    frame.current?.contentWindow?.postMessage(msg, window.location.origin);
  }, [slide, progress]);

  // 바뀔 때마다 보낸다. 창이 아직 준비되지 않았으면 준비됐다는 신호를 받고 보낸다
  useEffect(() => {
    send();
    const onReady = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      if ((e.data as { type?: string } | null)?.type === PREVIEW_READY) send();
    };
    window.addEventListener("message", onReady);
    return () => window.removeEventListener("message", onReady);
  }, [send]);

  return (
    <figure className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <figcaption className="text-secondary text-2xs flex items-center gap-1.5">
        <Icon size={14} weight="light" aria-hidden="true" />
        {label} <span className="text-muted tabular-nums">{width}×{height}</span>
      </figcaption>
      <div
        ref={box}
        className="border-subtle bg-band/40 relative w-full overflow-hidden border"
        style={{ height: scale ? height * scale : undefined, aspectRatio: scale ? undefined : `${width} / ${height}` }}
      >
        <iframe
          ref={frame}
          src="/banner-preview/"
          title={`${label} 미리보기`}
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 origin-top-left border-0 bg-white"
          style={{ width, height, transform: `scale(${scale})`, visibility: scale ? "visible" : "hidden" }}
        />
      </div>
    </figure>
  );
}

export function HeroBannerPreview({ slide, emptyText }: { slide: HeroSlide | null; emptyText: string }) {
  const [progress, setProgress] = useState(0);
  const tab = (on: boolean) =>
    `ease-fluid min-h-10 px-4 text-xs transition-colors duration-300 ${on ? "bg-primary text-white" : "text-secondary hover:text-accent"}`;

  return (
    <section aria-label="배너 미리보기" className="border-subtle bg-surface border p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-primary text-base font-semibold">미리보기</h2>
          <p className="text-muted text-2xs mt-1">저장하기 전 모습입니다. 고치는 대로 바로 바뀝니다.</p>
        </div>
        {slide?.layout !== "image" && (
        <div role="group" aria-label="미리볼 장면" className="border-subtle inline-flex border">
          <button type="button" aria-pressed={progress === 0} onClick={() => setProgress(0)} className={tab(progress === 0)}>
            처음 화면
          </button>
          <button type="button" aria-pressed={progress === 1} onClick={() => setProgress(1)} className={tab(progress === 1)}>
            스크롤 뒤 (액자)
          </button>
        </div>
        )}
      </div>

      {slide ? (
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
          {DEVICES.map((d) => (
            <Device
              key={d.key}
              label={d.label}
              width={d.width}
              height={d.height}
              Icon={d.Icon}
              slide={slide}
              progress={progress}
              className={d.key === "pc" ? "lg:flex-1" : "mx-auto w-full max-w-[260px] lg:mx-0 lg:w-[240px] lg:shrink-0"}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted border-subtle mt-6 flex min-h-40 items-center justify-center border border-dashed px-6 text-center text-sm">
          {emptyText}
        </p>
      )}
    </section>
  );
}
