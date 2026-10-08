import { BUSINESS } from "@/data/business";
import { PRODUCTS as SAMPLE_PRODUCTS } from "@/data/products";
import type {
  Category,
  MeasurementField,
  Product,
  ProductLine,
  ProductPhoto,
  ProductStyle,
} from "@/types/product";

/**
 * 손님 화면의 상품 — **빌드할 때** 서버(BE)에서 받는다.
 *
 * ── 왜 빌드 때인가 (D3) ──────────────────────────────────
 * 정적 내보내기라 상품 목록·상세 HTML 을 빌드가 만든다. 상품명·가격·설명이 HTML 에 박혀서
 * 검색엔진과 카톡 미리보기가 JS 없이 읽는다. 대신 관리자가 상품을 공개하면 다시 빌드해야
 * 손님 화면이 바뀐다 — BE 가 Vercel 배포 훅을 불러 다시 빌드한다(FrontRebuildTrigger).
 *
 * ── 서버가 없으면 ───────────────────────────────────────
 * API 주소가 비어 있으면(화면 확인 단계) 임시 카탈로그(data/products.ts)를 쓴다.
 * **주소가 있는데 서버가 응답하지 않으면 빌드를 실패시킨다.** 조용히 임시 카탈로그로
 * 대신하면 가짜 상품이 운영 사이트에 올라간다. 실패한 배포는 옛 배포를 그대로 두므로 안전하다.
 *
 * 이 파일은 서버 컴포넌트(빌드)에서만 쓴다.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

/** 서버에서 받는가. false 면 임시 카탈로그다. */
export const CATALOG_FROM_API = API_BASE.length > 0;

// ── 서버 응답 모양 (BE ProductResponse) ─────────────────────

interface ApiImage {
  url: string;
  kind: "MAIN" | "WORN" | "DETAIL" | "CUTOUT" | "STORY";
  alt: string;
  width: number | null;
  height: number | null;
}

interface ApiSummary {
  slug: string;
}

interface ApiDetail {
  slug: string;
  name: string | null;
  summary: string | null;
  category: Category;
  line: ProductLine;
  style?: ProductStyle | null;
  priceKrw: number | null;
  listPriceKrw: number | null;
  description: string | null;
  intent: string | null;
  features: string | null;
  fabric: string | null;
  care: string | null;
  model: { heightCm: number | null; weightKg: number | null; size: string | null };
  leadTimeDays: number | null;
  sizeChart: { url: string; alt: string; width: number | null; height: number | null } | null;
  instagramUrl: string | null;
  notice: {
    color: string | null;
    manufacturer: string | null;
    countryOfOrigin: string | null;
    manufacturedOn: string | null;
  } | null;
  images: ApiImage[];
  skus: {
    size: string;
    orderable: boolean;
    measurements: { part: string; valueCm: number; toleranceCm: number | null }[];
  }[];
}

// ── 변환 ─────────────────────────────────────────────────────

/** 실측 부위. 순서가 곧 표의 열 순서다 — 서버 enum(MeasurementPart) 선언 순서와 같다. */
const PART_LABEL: Record<string, string> = {
  SHOULDER: "어깨",
  CHEST: "가슴",
  WAIST: "허리",
  SLEEVE: "소매",
  LENGTH: "총장",
  THIGH: "허벅지",
  HEM: "밑단",
  RISE: "밑위",
};
const PART_ORDER = Object.keys(PART_LABEL);

/** 사진 순서: 대표 → 착용 → 디테일. 같은 종류 안에서는 서버 순서(sortOrder)를 지킨다. */
const KIND_RANK: Record<string, number> = { MAIN: 0, WORN: 1, DETAIL: 2 };

/**
 * 품질보증기준 — 브랜드 공통. 상품마다 적지 않는다 (BE V11 주석).
 * 공정위 고시 「소비자분쟁해결기준」을 따른다는 문장이 업계 표준 표기다.
 */
const WARRANTY =
  "제품 하자·오배송 시 교환·반품·환불은 공정거래위원회 고시 「소비자분쟁해결기준」에 따릅니다.";

/** A/S 책임자와 연락처 — 브랜드 공통. 사업자 정보에서 만든다. */
function asContact(): string | null {
  if (!BUSINESS.companyName || !BUSINESS.phone) return null;
  return `${BUSINESS.companyName} · ${BUSINESS.phone}`;
}

function toProduct(d: ApiDetail): Product {
  const photos: ProductPhoto[] = d.images
    .filter((i) => i.kind !== "CUTOUT" && i.kind !== "STORY")
    .map((i, index) => ({ i, index }))
    .sort((a, b) => (KIND_RANK[a.i.kind] ?? 9) - (KIND_RANK[b.i.kind] ?? 9) || a.index - b.index)
    .map(({ i }) => ({ url: i.url, alt: i.alt }));

  const parts = PART_ORDER.filter((p) =>
    d.skus.some((s) => s.measurements.some((m) => m.part === p)),
  );
  const fields: MeasurementField[] = parts.map((p) => ({ key: p.toLowerCase(), label: PART_LABEL[p] }));

  // 허용 오차가 전 부위 같으면 한 줄로 안내한다. 섞여 있으면 표가 칸마다 말한다(지금은 생략).
  const tolerances = new Set(
    d.skus.flatMap((s) => s.measurements.map((m) => m.toleranceCm)).filter((t) => t != null),
  );
  const tolerance = tolerances.size === 1 ? `±${[...tolerances][0]}cm` : null;

  const sizes = d.skus.map((s) => s.size);

  return {
    slug: d.slug,
    name: d.name,
    category: d.category,
    line: d.line,
    style: d.style ?? null,
    priceKrw: d.priceKrw,
    listPriceKrw: d.listPriceKrw,
    summary: d.summary,
    description: d.description,
    intent: d.intent,
    features: d.features,
    leadTimeDays: d.leadTimeDays,
    images: photos,
    cutout: d.images.find((i) => i.kind === "CUTOUT")?.url ?? null,
    // 서버가 순서(sortOrder)대로 준다 — 관리자가 놓은 순서 그대로 이어 붙인다
    story: d.images
      .filter((i) => i.kind === "STORY")
      .map((i) => ({ url: i.url, alt: i.alt, width: i.width, height: i.height })),
    skus: d.skus.map((s) => ({
      id: `${d.slug}-${s.size}`,
      size: s.size,
      color: null,
      orderable: s.orderable,
    })),
    measurements: {
      fields,
      rows: d.skus.map((s) => ({
        size: s.size,
        values: Object.fromEntries(
          parts.map((p) => [
            p.toLowerCase(),
            s.measurements.find((m) => m.part === p)?.valueCm ?? null,
          ]),
        ),
      })),
      // TODO(고객확인) B-4 측정 기준(단면/둘레). 서버에 칸이 생기면 여기로 온다.
      basis: null,
      tolerance,
    },
    sizeChart: d.sizeChart,
    instagramUrl: d.instagramUrl,
    model: {
      heightCm: d.model.heightCm,
      weightKg: d.model.weightKg,
      wearingSize: d.model.size,
    },
    notice: {
      material: d.fabric,
      color: d.notice?.color ?? null,
      size: sizes.length > 0 ? `${sizes.join(" · ")} (부위별 실측은 상세 사이즈 참고)` : null,
      manufacturer: d.notice?.manufacturer ?? null,
      countryOfOrigin: d.notice?.countryOfOrigin ?? null,
      washingInstruction: d.care,
      manufacturedAt: d.notice?.manufacturedOn ?? null,
      warranty: WARRANTY,
      asContact: asContact(),
    },
  };
}

// ── 불러오기 ────────────────────────────────────────────────

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    // 빌드를 멈춘다. 위 머리말 "서버가 없으면" 참고.
    throw new Error(`상품 API 응답 실패: ${path} → ${res.status}`);
  }
  return (await res.json()) as T;
}

async function load(): Promise<Product[]> {
  const list = await getJson<ApiSummary[]>("/api/products");
  const details = await Promise.all(
    list.map((s) => getJson<ApiDetail>(`/api/products/${encodeURIComponent(s.slug)}`)),
  );
  return details.map(toProduct);
}

/*
 * 빌드에서는 한 번만 받는다 — 페이지마다(목록·상세 N개·메인·장바구니) 다시 받으면
 * 상품 수의 제곱만큼 요청이 나간다. 개발 서버에서는 매번 받는다: 관리자에서 고친 것이
 * 새로고침하면 바로 보여야 한다.
 */
let memo: Promise<Product[]> | null = null;

export function getCatalog(): Promise<Product[]> {
  if (!CATALOG_FROM_API) return Promise.resolve(SAMPLE_PRODUCTS);
  if (process.env.NODE_ENV !== "production") return load();
  memo ??= load();
  return memo;
}

export async function getCatalogProduct(slug: string): Promise<Product | undefined> {
  return (await getCatalog()).find((p) => p.slug === slug);
}

/** 목록 필터 선택지. 카탈로그에서 뽑는다 — 하드코딩하면 상품이 늘 때 조용히 빠진다. */
export function filterOptions(products: Product[]) {
  return {
    categories: [...new Set(products.map((p) => p.category))].sort(),
    // 숫자 사이즈는 숫자 순으로 (문자열 정렬이면 100 · 105 · 110 · 95 가 된다)
    sizes: [...new Set(products.flatMap((p) => p.skus.map((s) => s.size)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
  };
}
