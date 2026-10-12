/**
 * 메인 배너 목록 — **빌드할 때** 서버에서 받는다 (lib/siteImages.ts · lib/why.ts 와 같은 규칙, 서버 hero_banner V25).
 *
 * 관리자가 /admin/display/banner 에서 배너를 등록한다. 배너 하나는 둘 중 하나다:
 *   PRODUCT  상품 정보 가져오기 — 공개 상품의 누끼 · 착용 · 디테일 사진. 문구를 적으면 상품 이름 · 가격 대신 그 문구
 *   CUSTOM   직접 등록 — 올린 사진(인물 · 액자 둘)과 문구 · 버튼
 * 서버는 **손님 화면에 나갈 배너만** 순서대로 준다(켜 두었고, 상품이 공개 중이거나 인물 사진이 있는 것).
 * 그림으로 바꾸는 일은 메인 페이지가 한다(components/home/HeroReveal pickHeroSlides). 하나도 없으면
 * 진열 순서 맨 앞 상품이 나간다 — 배너가 비는 일은 없다.
 *
 * API 주소가 없으면(화면 확인 단계) 빈 목록, 주소가 있는데 응답하지 않으면 빌드를 실패시킨다.
 * 이 파일은 서버 컴포넌트(빌드)에서만 쓴다.
 */

export type HeroBannerKind = "PRODUCT" | "CUSTOM";

export interface BannerPhoto {
  url: string;
  alt: string;
}

export interface HeroBanner {
  kind: HeroBannerKind;
  /** 상품 배너의 상품 주소 */
  productSlug: string | null;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  /** 사이트 안 주소(/…) 또는 https 주소. 비면 상품 페이지(상품 배너) · 전체 제품(직접 등록) */
  ctaUrl: string;
  figure: BannerPhoto | null;
  frameLeft: BannerPhoto | null;
  frameRight: BannerPhoto | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
// 빌드 때 받아 오는 주소 — 서버의 빌더는 내부 주소(API_BUILD_BASE)를 준다. lib/catalog.ts 참고
const FETCH_BASE = process.env.API_BUILD_BASE || API_BASE;

const photo = (p: Partial<BannerPhoto> | null | undefined): BannerPhoto | null =>
  p?.url ? { url: p.url, alt: p.alt ?? "" } : null;

async function load(): Promise<HeroBanner[]> {
  const res = await fetch(`${FETCH_BASE}/api/hero-banners`);
  if (!res.ok) {
    throw new Error(`메인 배너 API 응답 실패: ${res.status}`);
  }
  const list = (await res.json()) as Partial<HeroBanner>[];
  return list
    .filter((d) => d.kind === "PRODUCT" || d.kind === "CUSTOM")
    .map((d) => ({
      kind: d.kind as HeroBannerKind,
      productSlug: d.productSlug ?? null,
      eyebrow: d.eyebrow ?? "",
      title: d.title ?? "",
      subtitle: d.subtitle ?? "",
      ctaLabel: d.ctaLabel ?? "",
      ctaUrl: d.ctaUrl ?? "",
      figure: photo(d.figure),
      frameLeft: photo(d.frameLeft),
      frameRight: photo(d.frameRight),
    }));
}

let memo: Promise<HeroBanner[]> | null = null;

export function getHeroBanners(): Promise<HeroBanner[]> {
  if (!API_BASE) return Promise.resolve([]);
  if (process.env.NODE_ENV !== "production") return load();
  memo ??= load();
  return memo;
}
