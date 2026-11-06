/**
 * 굽높이 옵션 (서버 V49, 2026-11-06 고객 "270 사이즈에 굽높이 3cm 추가 — 기본, 1 ~ 6cm 추가").
 *
 * 관리자가 켠 상품은 손님이 사이즈와 함께 굽높이를 고른다. 추가 금액은 없다.
 * 장바구니 · 주문의 사이즈 칸에는 한 줄로 간다 — "270 · 굽 +3cm". 재고는 사이즈(270)로 센다.
 * 서버(Product.HeelChoice)가 같은 모양으로 다시 읽는다. 이 파일의 글자 모양을 바꾸면 서버도 같이 바꿔야 한다.
 * 고를 수 있는 굽 목록은 서버가 상품마다 준다(product.heels) — 여기서 따로 정하지 않는다.
 */

const MARK = " · 굽 ";

export function heelLabel(size: string, heel: string): string {
  return `${size}${MARK}${heel}`;
}

/** heelLabel 의 반대. 굽이 없는 줄이면 null */
export function parseHeelLabel(text: string): { size: string; heel: string } | null {
  const at = text.lastIndexOf(MARK);
  if (at <= 0) return null;
  return { size: text.slice(0, at), heel: text.slice(at + MARK.length) };
}
