/**
 * 상품 등록을 빠르게 — 색상 고르기 · 주소(slug) 만들기 · 지난번 입력값 (2026-10-13 "관리자 등록을 직관적으로").
 *
 * 이 브랜드는 같은 옷을 색마다 따로 등록한다(상품 하나 = 색 하나). 그래서 색상이 곧 주소의 앞머리다:
 *   클래식 스판덱스 셔츠 · 화이트  →  white-spandex-shirt
 * 색 이름(한글)을 영어로 바꾸는 표가 여기 있다. 표에 없는 색은 주소를 직접 적는다.
 */

/** 자주 쓰는 색 — 관리자 화면의 색상 버튼. 고르면 상품정보고시의 색상 칸이 채워진다 */
export const COLOR_CHOICES: { ko: string; en: string }[] = [
  { ko: "화이트", en: "white" },
  { ko: "블랙", en: "black" },
  { ko: "네이비", en: "navy" },
  { ko: "차콜", en: "charcoal" },
  { ko: "그레이", en: "grey" },
  { ko: "베이지", en: "beige" },
  { ko: "브라운", en: "brown" },
  { ko: "딥브라운", en: "deep-brown" },
  { ko: "카키", en: "khaki" },
  { ko: "올리브", en: "olive" },
  { ko: "스카이블루", en: "sky-blue" },
  { ko: "블루", en: "blue" },
  { ko: "핑크", en: "pink" },
  { ko: "그레이스트라이프", en: "grey-stripe" },
  { ko: "블루스트라이프", en: "blue-stripe" },
  { ko: "차콜스트라이프", en: "charcoal-stripe" },
  { ko: "멀티스트라이프", en: "multi-stripe" },
];

/** "화이트" → "white". 띄어쓰기 · 대소문자는 무시. 표에 없으면 null */
export function colorSlug(color: string): string | null {
  const key = color.replace(/\s+/g, "").toLowerCase();
  return COLOR_CHOICES.find((c) => c.ko === key || c.en === key)?.en ?? null;
}

/**
 * 주소에서 색 앞머리를 떼어 낸 나머지 — "white-spandex-shirt" + 색 "화이트" → "spandex-shirt".
 * 앞머리가 그 색이 아니면 주소 전체를 그대로 돌려준다.
 */
export function slugBase(slug: string, color: string): string {
  const c = colorSlug(color);
  return c && slug.startsWith(`${c}-`) ? slug.slice(c.length + 1) : slug;
}

/** 색 + 나머지 → 주소. 색을 모르면 나머지만 */
export function slugFor(base: string, color: string): string {
  const c = colorSlug(color);
  return c && base ? `${c}-${base}` : base;
}

/** 상품명 끝의 "(화이트)" 같은 색 표기를 뗀다 — 복제할 때 새 색으로 바꿔 붙이려고 */
export function nameWithoutColor(name: string): string {
  return name.replace(/\s*\([^()]*\)\s*$/, "").trim();
}

// ── 지난번 입력값 ───────────────────────────────────────────
// 제조자 · 제조국 · 제작 기간 · 라인은 상품마다 거의 같다. 마지막으로 등록한 값을 이 브라우저에 기억했다가 새 상품에 채운다.
// 이 브라우저에만 남는다(서버에 저장하지 않는다) — 다른 컴퓨터에서는 빈 칸으로 시작한다.

const KEY = "lf-admin-product-defaults";

export interface ProductDefaults {
  manufacturer?: string;
  countryOfOrigin?: string;
  leadTimeDays?: string;
  line?: string;
}

export function loadDefaults(): ProductDefaults {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProductDefaults) : {};
  } catch {
    return {};
  }
}

export function saveDefaults(d: ProductDefaults) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // 저장소가 막힌 브라우저(사생활 보호 모드 등) — 다음에 빈 칸으로 시작할 뿐이다
  }
}
