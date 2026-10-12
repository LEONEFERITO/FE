/**
 * 메인 배너 설정 — **빌드할 때** 서버에서 받는다 (lib/siteImages.ts · lib/why.ts 와 같은 규칙, 서버 hero_config V24).
 *
 * 관리자가 /admin/display/banner 에서 고른다:
 *   AUTO     진열 순서 맨 앞 공개 상품 (지금까지의 방식)
 *   PRODUCT  관리자가 고른 공개 상품 하나 — 손님 쪽에는 주소(slug)로 온다
 *   CUSTOM   관리자가 직접 올린 사진(사이트 사진 칸 HERO_*)과 문구 · 버튼
 * 무엇을 그릴지는 메인 페이지가 정한다(components/home/HeroReveal pickHeroSlide) — 고른 상품이 없거나
 * 직접 올리기인데 인물 사진이 없으면 AUTO 로 돌아간다. 배너가 비는 일은 없다.
 *
 * API 주소가 없으면(화면 확인 단계) AUTO, 주소가 있는데 응답하지 않으면 빌드를 실패시킨다.
 * 이 파일은 서버 컴포넌트(빌드)에서만 쓴다.
 */

export type HeroMode = "AUTO" | "PRODUCT" | "CUSTOM";

export interface HeroConfig {
  mode: HeroMode;
  /** mode = PRODUCT 일 때 상품 주소. 상품이 지워졌으면 null */
  productSlug: string | null;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  /** 사이트 안 주소(/…) 또는 https 주소. 비면 전체 제품 */
  ctaUrl: string;
}

const AUTO: HeroConfig = { mode: "AUTO", productSlug: null, eyebrow: "", title: "", subtitle: "", ctaLabel: "", ctaUrl: "" };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
// 빌드 때 받아 오는 주소 — 서버의 빌더는 내부 주소(API_BUILD_BASE)를 준다. lib/catalog.ts 참고
const FETCH_BASE = process.env.API_BUILD_BASE || API_BASE;

async function load(): Promise<HeroConfig> {
  const res = await fetch(`${FETCH_BASE}/api/hero`);
  if (!res.ok) {
    throw new Error(`메인 배너 API 응답 실패: ${res.status}`);
  }
  const d = (await res.json()) as Partial<HeroConfig>;
  return {
    mode: d.mode === "PRODUCT" || d.mode === "CUSTOM" ? d.mode : "AUTO",
    productSlug: d.productSlug ?? null,
    eyebrow: d.eyebrow ?? "",
    title: d.title ?? "",
    subtitle: d.subtitle ?? "",
    ctaLabel: d.ctaLabel ?? "",
    ctaUrl: d.ctaUrl ?? "",
  };
}

let memo: Promise<HeroConfig> | null = null;

export function getHero(): Promise<HeroConfig> {
  if (!API_BASE) return Promise.resolve(AUTO);
  if (process.env.NODE_ENV !== "production") return load();
  memo ??= load();
  return memo;
}
