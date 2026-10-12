"use client";

import { useEffect, useState } from "react";

import { HeroReveal } from "@/components/home/HeroReveal";
import { Header } from "@/components/layout/Header";
import { PREVIEW_READY, PREVIEW_SLIDE, type PreviewMessage } from "@/lib/bannerPreview";
import type { HeroSlide } from "@/lib/heroSlide";

/**
 * 배너 미리보기 창의 안쪽 (/banner-preview/) — 관리자 "메인 배너" 화면이 PC · 모바일 크기의 창(iframe)으로 띄운다.
 *
 * 창을 실제 폭(1440 · 390)으로 열어야 화면 폭 규칙(md · lg)이 손님 화면과 똑같이 걸린다. 관리자 화면 안에 그냥 그리면
 * 관리자 화면의 폭으로 그려져서 모바일 모양을 볼 수 없다.
 *
 * 그릴 장면은 바깥 관리자 화면이 postMessage 로 보낸다 — **같은 사이트에서 온 메시지만** 받는다.
 * 스크롤 대신 바깥이 고른 진행도(--preview-p: 0 처음 화면 · 1 액자까지 다 나온 화면)로 그린다(globals.css).
 * 이 창 안의 링크는 누를 수 없다(바깥에서 막는다). 검색에는 나가지 않는다(noindex · sitemap 에 없음).
 */

export function BannerPreviewCanvas() {
  const [slide, setSlide] = useState<HeroSlide | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.bannerPreview = "";
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const data = e.data as Partial<PreviewMessage> | null;
      if (!data || data.type !== PREVIEW_SLIDE) return;
      const p = Number(data.progress);
      root.style.setProperty("--preview-p", String(Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 1));
      setSlide(data.slide ?? null);
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: PREVIEW_READY }, window.location.origin);
    return () => {
      window.removeEventListener("message", onMessage);
      delete root.dataset.bannerPreview;
    };
  }, []);

  return (
    <>
      <Header overHero />
      <main className="flex-1">
        {slide ? (
          <HeroReveal slides={[slide]} autoplay={false} />
        ) : (
          <p className="text-muted flex min-h-svh items-center justify-center text-sm">미리볼 배너가 없습니다</p>
        )}
      </main>
    </>
  );
}
