import type { HeroSlide } from "@/lib/heroSlide";

/**
 * 관리자 "메인 배너" 화면 ↔ 미리보기 창(/banner-preview/) 사이의 메시지.
 * 창이 준비되면 READY 를 보내고, 관리자 화면은 그릴 장면을 SLIDE 로 보낸다. 같은 사이트끼리만 주고받는다.
 */
export const PREVIEW_READY = "lf-banner-preview:ready";
export const PREVIEW_SLIDE = "lf-banner-preview:slide";

export interface PreviewMessage {
  type: typeof PREVIEW_SLIDE;
  slide: HeroSlide | null;
  /** 0 처음 화면 · 1 스크롤 뒤(액자까지) */
  progress: number;
}
