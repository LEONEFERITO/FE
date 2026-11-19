import type { Product, SuitPiece } from "@/types/product";

/**
 * 수트 구성 (서버 V43, 2026-10-28 디자이너 "3피스 / 2피스 구성 선택 + 자켓 · 베스트 · 팬츠 사이즈 따로").
 *
 * 사이즈에 조각(자켓 · 베스트 · 팬츠)이 붙은 상품이 "수트 구성" 상품이다.
 *   3피스 = 자켓 + 베스트 + 팬츠 — 값은 판매가(priceKrw)
 *   2피스 = 자켓 + 팬츠           — 값은 2피스 판매가(twoPiecePriceKrw). 없으면 2피스는 팔지 않는다
 *
 * 장바구니 · 주문에는 고른 구성을 한 줄로 보낸다 — "3피스 · 자켓 L / 베스트 M / 팬츠 L".
 * 서버(Product.SuitChoice)가 같은 모양으로 다시 읽고 값 · 재고를 정한다. 이 파일의 글자 모양을 바꾸면 서버도 같이 바꿔야 한다.
 */

export type SuitSet = "THREE" | "TWO";

export const SUIT_PIECES: SuitPiece[] = ["JACKET", "VEST", "PANTS"];

export const PIECE_LABEL: Record<SuitPiece, string> = {
  JACKET: "자켓",
  VEST: "베스트",
  PANTS: "팬츠",
};

export const SUIT_SETS: Record<SuitSet, { label: string; pieces: SuitPiece[]; detail: string }> = {
  THREE: { label: "3피스", pieces: ["JACKET", "VEST", "PANTS"], detail: "자켓 + 베스트 + 팬츠" },
  TWO: { label: "2피스", pieces: ["JACKET", "PANTS"], detail: "자켓 + 팬츠" },
};

export type SuitSizes = Partial<Record<SuitPiece, string>>;

/** 조각이 붙은 사이즈가 있으면 수트 구성 상품 */
export const isSuitSet = (p: Pick<Product, "skus">): boolean => p.skus.some((s) => s.piece);

/** 이 구성의 한 벌 값. 팔지 않으면 null */
export function suitPrice(p: Pick<Product, "priceKrw" | "twoPiecePriceKrw">, set: SuitSet): number | null {
  return set === "THREE" ? p.priceKrw : (p.twoPiecePriceKrw ?? null);
}

/** 손님이 고를 수 있는 구성 — 값이 있고, 조각마다 사이즈가 있다(서버 Product.offers 와 같다) */
export function offeredSets(p: Pick<Product, "skus" | "priceKrw" | "twoPiecePriceKrw">): SuitSet[] {
  return (Object.keys(SUIT_SETS) as SuitSet[]).filter(
    (set) => suitPrice(p, set) != null && SUIT_SETS[set].pieces.every((pc) => p.skus.some((s) => s.piece === pc)),
  );
}

/** "3피스 · 자켓 L / 베스트 M / 팬츠 L". 구성의 조각 하나라도 사이즈가 없으면 null(아직 다 안 골랐다) */
export function suitLabel(set: SuitSet, sizes: SuitSizes): string | null {
  const pieces = SUIT_SETS[set].pieces;
  if (pieces.some((pc) => !sizes[pc])) return null;
  return `${SUIT_SETS[set].label} · ${pieces.map((pc) => `${PIECE_LABEL[pc]} ${sizes[pc]}`).join(" / ")}`;
}

/** suitLabel 의 반대. 모양이 다르면 null — 보통 사이즈("L")도 null */
export function parseSuitLabel(text: string): { set: SuitSet; sizes: SuitSizes } | null {
  for (const set of Object.keys(SUIT_SETS) as SuitSet[]) {
    const head = `${SUIT_SETS[set].label} · `;
    if (!text.startsWith(head)) continue;
    const parts = text.slice(head.length).split(" / ");
    const pieces = SUIT_SETS[set].pieces;
    if (parts.length !== pieces.length) return null;
    const sizes: SuitSizes = {};
    for (let i = 0; i < parts.length; i++) {
      const prefix = `${PIECE_LABEL[pieces[i]]} `;
      if (!parts[i].startsWith(prefix) || parts[i].length === prefix.length) return null;
      sizes[pieces[i]] = parts[i].slice(prefix.length);
    }
    return suitLabel(set, sizes) === text ? { set, sizes } : null;
  }
  return null;
}

/**
 * 처음 고른 상태 — 2피스를 팔면 2피스, 아니면 파는 첫 구성. 조각마다 주문할 수 있는 첫 사이즈.
 * 2026-11-19 고객 요청: 목록에 2피스 값이 먼저 보이므로(displayPrice), 상세에 들어와서도 같은 값이 먼저 보여야 한다.
 */
export function suitDefaults(p: Pick<Product, "skus" | "priceKrw" | "twoPiecePriceKrw">): { set: SuitSet | null; sizes: SuitSizes } {
  const sizes: SuitSizes = {};
  for (const pc of SUIT_PIECES) {
    const first = p.skus.find((s) => s.piece === pc && s.orderable);
    if (first) sizes[pc] = first.size;
  }
  const sets = offeredSets(p);
  return { set: sets.includes("TWO") ? "TWO" : (sets[0] ?? null), sizes };
}

/**
 * 겉(상품 카드 · 빠른 보기 · 메인 슬라이드 · 가격순 정렬)에 먼저 보일 값.
 *
 * 2026-11-19 고객 요청: 베스트가 있는 3피스 수트는 2피스(자켓 + 팬츠) 값을 먼저 보이고, 3피스 값은 상세에서 고르게 한다.
 * 관리자 입력은 그대로다 — 판매가 = 3피스, 2피스 = 판매가 − 베스트 금액(서버 V44).
 * twoPiece 가 true 면 보이는 값이 판매가가 아니다 → 정가(취소선)는 3피스 기준이라 그리지 않는다.
 * skus 가 없는 모양(관리자 배너 미리보기)은 판매가 그대로.
 */
export function displayPrice(
  p: Pick<Product, "priceKrw"> & Partial<Pick<Product, "skus" | "twoPiecePriceKrw">>,
): { priceKrw: number | null; twoPiece: boolean } {
  const skus = p.skus;
  if (skus && skus.some((s) => s.piece === "VEST") && p.twoPiecePriceKrw != null) {
    if (offeredSets({ skus, priceKrw: p.priceKrw, twoPiecePriceKrw: p.twoPiecePriceKrw }).includes("TWO")) {
      return { priceKrw: p.twoPiecePriceKrw, twoPiece: true };
    }
  }
  return { priceKrw: p.priceKrw, twoPiece: false };
}
