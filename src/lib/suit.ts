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

/** 처음 고른 상태 — 파는 첫 구성(3피스 먼저), 조각마다 주문할 수 있는 첫 사이즈 */
export function suitDefaults(p: Pick<Product, "skus" | "priceKrw" | "twoPiecePriceKrw">): { set: SuitSet | null; sizes: SuitSizes } {
  const sizes: SuitSizes = {};
  for (const pc of SUIT_PIECES) {
    const first = p.skus.find((s) => s.piece === pc && s.orderable);
    if (first) sizes[pc] = first.size;
  }
  return { set: offeredSets(p)[0] ?? null, sizes };
}
