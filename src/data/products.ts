import type { Category, Product, ProductLine } from "@/types/product";

import { SAMPLE_PRODUCT } from "./sample-product";

/**
 * 화면 개발용 임시 카탈로그.
 *
 * BE 상품 API(Phase 2)가 생기면 이 파일은 사라진다.
 *
 * 주의: **확인되지 않은 값은 전부 null 이다.** 치수·가격·소재를 그럴듯하게 채워 넣으면
 * 화면은 완성돼 보이지만 그 값이 실제와 다르다는 걸 아무도 눈치채지 못한 채 오픈까지 간다.
 * null 은 화면에서 "확인 필요" 로 보이므로 잊히지 않는다.
 *
 * 지금 채워져 있는 것: **사진 · 카테고리 · 핏 · 사이즈 라벨** 뿐이다.
 * 사진은 촬영 원본(webp 로 줄인 것)이고, 나머지는 docs/CLIENT_QUESTIONS.md B-1~B-6 에 있다.
 * 누끼 버전은 히어로 전용이다 — 카드에서 누끼를 쓰면 배경을 흉내 내야 해서 부자연스럽다.
 */

/** 사이즈 라벨은 아직 미확정이다 (B-3: 95/100/105 인지 S/M/L 인지). 임시로 한 벌만 쓴다. */
const SIZES = ["95", "100", "105", "110"] as const;

const EMPTY_MEASUREMENTS = (fields: { key: string; label: string }[]) => ({
  fields,
  rows: SIZES.map((size) => ({
    size,
    values: Object.fromEntries(fields.map((f) => [f.key, null])) as Record<
      string,
      number | null
    >,
  })),
  basis: null,
  tolerance: null,
});

const EMPTY_NOTICE = {
  material: null,
  color: null,
  size: null,
  manufacturer: null,
  countryOfOrigin: null,
  washingInstruction: null,
  manufacturedAt: null,
  warranty: null,
  asContact: null,
};

const TOP_FIELDS = [
  { key: "shoulder", label: "어깨" },
  { key: "chest", label: "가슴" },
  { key: "sleeve", label: "소매" },
  { key: "length", label: "총장" },
];

function draft(
  slug: string,
  category: Category,
  line: ProductLine,
  image: string,
  cutout: string,
  soldOut: string[] = [],
): Product {
  return {
    slug,
    name: null, // TODO(고객확인) B-1 제품명
    category,
    line,
    priceKrw: null, // TODO(고객확인) B-2 가격
    listPriceKrw: null,
    images: [image],
    cutout,
    // 품절(stock 0)은 숨기지 않고 비활성으로 노출한다 — 숨기면 "내 사이즈가 원래 없는
    // 브랜드" 로 보이고, 보여주면 "이번에 품절" 로 읽힌다.
    skus: SIZES.map((size) => ({
      id: `${slug}-${size}`,
      size,
      color: null,
      stock: soldOut.includes(size) ? 0 : 5,
    })),
    measurements: EMPTY_MEASUREMENTS(TOP_FIELDS),
    // 차트 이미지는 관리자가 올린다. 아직 없다.
    sizeChart: null,
    // 인스타그램 게시물이 있는 상품만 채운다. 없으면 상세에서 버튼을 숨긴다.
    instagramUrl: null,
    model: { heightCm: null, weightKg: null, wearingSize: null },
    notice: { ...EMPTY_NOTICE },
  };
}

export const PRODUCTS: Product[] = [
  draft(
    "brown-shirt",
    "SHIRT",
    "FERITO",
    "/products/photo-brown-shirt.webp",
    "/products/cutout-brown-shirt.webp",
    ["110"],
  ),
  draft(
    "white-shirt",
    "SHIRT",
    "FERITO",
    "/products/photo-white-shirt.webp",
    "/products/cutout-white-shirt.webp",
  ),
  draft(
    "grey-shirt",
    "SHIRT",
    "LEONE",
    "/products/photo-grey-shirt.webp",
    "/products/cutout-grey-shirt.webp",
    ["95"],
  ),
  draft(
    "black-shirt",
    "SHIRT",
    "LEONE",
    "/products/photo-black-shirt.webp",
    "/products/cutout-black-shirt.webp",
  ),
  SAMPLE_PRODUCT,
];

export function findProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

/** 목록 필터에 쓸 선택지. 데이터에서 뽑는다 — 하드코딩하면 상품이 늘 때 조용히 빠진다. */
export const CATEGORIES = [...new Set(PRODUCTS.map((p) => p.category))].sort();

/** 라인 필터 선택지. 카탈로그에 실제로 있는 라인만 노출한다. */
export const LINES = [...new Set(PRODUCTS.map((p) => p.line))];
export const SIZE_OPTIONS = [
  ...new Set(PRODUCTS.flatMap((p) => p.skus.map((s) => s.size))),
].sort();
