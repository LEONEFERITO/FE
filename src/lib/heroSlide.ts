import type { BannerPhoto, HeroBanner } from "@/lib/hero";
import { CATEGORY_LABEL, LINE_LABEL, type Product, type ProductPhoto } from "@/types/product";

/**
 * 메인 배너의 "장면" — 그림과 글자 한 벌. 메인(빌드)과 관리자 미리보기가 같은 함수로 만든다:
 * 미리보기와 손님 화면이 다른 규칙으로 그려지면 미리보기가 거짓말을 한다.
 *
 *   상품 정보 가져오기  상품의 누끼 · 착용 · 디테일 사진. 문구를 적은 줄만 상품 이름 · 가격 대신 그 문구
 *   직접 등록           올린 인물 · 액자 사진과 문구. 액자를 비우면 인물 사진을 잘라 쓴다
 */

const KRW = new Intl.NumberFormat("ko-KR");

/** 액자에 넣을 컷. 전용 사진이 없으면 대표 사진을 다른 자리로 잘라 쓴다. */
export interface DetailCut {
  src: string;
  alt: string;
  /** object-position. 전용 컷은 가운데, 크롭 대체는 자리마다 다르다. */
  position: string;
}

export interface HeroSlide {
  figure: { src: string; alt: string } | null;
  frames: [DetailCut, DetailCut];
  /** 이름 위 작은 줄 (예: SHIRT · 레오네 라인). 비면 그리지 않는다 */
  eyebrow: string;
  /** 큰 이름 */
  title: string;
  /** 이름 아래 줄 (가격 등). 비면 그리지 않는다 */
  subtitle: string;
  primary: { label: string; href: string };
  /** 오른쪽 아래 캡션의 둘째 줄. null 이면 LEONE FERITO 한 줄만 */
  captionSub: string | null;
}

/** 배너 문구 — 관리자가 적는 다섯 줄. 비운 줄은 기본값(상품 이름 · 가격 등)이 나간다. */
export interface BannerText {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
}

/** 배너가 상품에서 쓰는 값만 — 관리자 화면은 상품 전체(Product)가 아니라 수정용 응답에서 만든다 */
export type SlideProduct = Pick<Product, "slug" | "name" | "category" | "line" | "priceKrw" | "cutout" | "images">;

/** 서버와 같은 규칙: 사이트 안 주소(/…, // 는 안 됨) 또는 https 주소. 아니면 버린다 */
const SAFE_URL = /^\/(?!\/)\S*$|^https:\/\/\S+$/;
const safeHref = (url: string, fallback: string) => (SAFE_URL.test(url) ? url : fallback);

function detailCuts(product: SlideProduct): [DetailCut, DetailCut] {
  const name = product.name ?? "제품";
  const [main, second, third] = product.images as (ProductPhoto | undefined)[];
  const fallback = main?.url ?? "";

  const left: DetailCut = second
    ? { src: second.url, alt: second.alt, position: "50% 50%" }
    : { src: fallback, alt: `${name} 디테일 — 칼라와 어깨선`, position: "50% 14%" };
  const right: DetailCut = third
    ? { src: third.url, alt: third.alt, position: "50% 50%" }
    : { src: fallback, alt: `${name} 디테일 — 소매와 허리선`, position: "50% 46%" };

  return [left, right];
}

export function slideFromProduct(product: SlideProduct, text?: BannerText): HeroSlide {
  const name = product.name ?? "제품명 확인 중";
  const fit = LINE_LABEL[product.line];
  const category = CATEGORY_LABEL[product.category];
  const figure = product.cutout ?? product.images[0]?.url ?? null;
  const href = `/products/${product.slug}`;
  return {
    figure: figure ? { src: figure, alt: `${name} 착용 컷` } : null,
    frames: detailCuts(product),
    eyebrow: text?.eyebrow || `${category?.en ?? product.category} · ${fit?.ko ?? ""}`,
    title: text?.title || name,
    subtitle: text?.subtitle || (product.priceKrw !== null ? `${KRW.format(product.priceKrw)}원` : "가격 문의"),
    primary: { label: text?.ctaLabel || "자세히 보기", href: text?.ctaUrl ? safeHref(text.ctaUrl, href) : href },
    // fit.ko 가 이미 "페리토 라인" 이다 — 뒤에 "라인" 을 또 붙이면 "라인 라인" 이 된다
    captionSub: fit ? `${fit.ko} · ${fit.kind}` : null,
  };
}

/** 직접 등록 — 인물 사진이 없으면 null(그 배너는 건너뛴다). 액자를 비우면 인물 사진을 잘라 쓴다. */
export function slideFromCustom(
  banner: BannerText & { figure: BannerPhoto | null; frameLeft: BannerPhoto | null; frameRight: BannerPhoto | null },
): HeroSlide | null {
  const figure = banner.figure;
  if (!figure) return null;
  const cut = (photo: BannerPhoto | null, position: string): DetailCut =>
    photo ? { src: photo.url, alt: photo.alt, position: "50% 50%" } : { src: figure.url, alt: "", position };
  return {
    figure: { src: figure.url, alt: figure.alt || banner.title || "메인 배너" },
    frames: [cut(banner.frameLeft, "50% 14%"), cut(banner.frameRight, "50% 46%")],
    eyebrow: banner.eyebrow,
    title: banner.title,
    subtitle: banner.subtitle,
    primary: { label: banner.ctaLabel || "자세히 보기", href: safeHref(banner.ctaUrl, "/products/") },
    captionSub: null,
  };
}

/**
 * 서버가 준 배너(이미 "나가는 것" 만, 순서대로)를 장면으로 바꾼다. 그릴 수 없는 배너(상품 사진이 없다 등)는 건너뛴다.
 * 하나도 남지 않으면 진열 순서 맨 앞 상품 — 그것도 없으면 빈 목록(배너 없음, 메인이 분할형으로 대신한다).
 */
export function pickHeroSlides(banners: HeroBanner[], catalog: Product[], featured: Product[]): HeroSlide[] {
  const slides: HeroSlide[] = [];
  for (const b of banners) {
    if (b.kind === "CUSTOM") {
      const s = slideFromCustom(b);
      if (s) slides.push(s);
    } else {
      const p = catalog.find((c) => c.slug === b.productSlug && c.images.length > 0);
      if (p) slides.push(slideFromProduct(p, b));
    }
  }
  if (slides.length > 0) return slides;
  return featured[0] ? [slideFromProduct(featured[0])] : [];
}
