/**
 * 배송 · 교환 · 반품 정책 (2026-10-14 — 국내 의류몰에서 흔한 방식으로 정했다).
 *
 * 금액 계산은 서버가 한다(BE application.yml app.order.*) — 이 파일은 손님에게 보여 주는 **안내 문구**다.
 * 서버 값과 같아야 한다. 하나를 바꾸면 다른 하나도 바꾼다.
 * 택배사: CJ대한통운 (2026-10-14 대표님 확인). 도서산간 우편번호도 CJ대한통운 목록 기준으로 넓힌다(BE ORDER_REMOTE_AREAS).
 */
const KRW = new Intl.NumberFormat("ko-KR");
const won = (n: number) => `${KRW.format(n)}원`;

export const SHIPPING = {
  /** 기본 배송비 */
  feeKrw: 3000,
  /** 상품 금액이 이 이상이면 기본 배송비 0원 */
  freeThresholdKrw: 50000,
  /** 제주 추가 배송비 (무료 배송 주문에도) */
  jejuExtraKrw: 3000,
  /** 도서산간 추가 배송비 (무료 배송 주문에도) */
  islandExtraKrw: 5000,
  /** 단순 변심 교환 · 반품 — 왕복 배송비(손님 부담) */
  changeOfMindRoundTripKrw: 6000,
  /** 단순 변심 교환 · 반품 신청 기간 — 받은 다음 날부터 (BE app.returns.change-of-mind-days) */
  changeOfMindDays: 7,
  /** 택배사 */
  courier: "CJ대한통운",
} as const;

/** 한 줄 요약들 — 상품 화면 · 장바구니 · 안내 페이지가 같이 쓴다. */
export const SHIPPING_LINES = {
  fee: `배송비 ${won(SHIPPING.feeKrw)} · ${won(SHIPPING.freeThresholdKrw)} 이상 무료 배송`,
  remote: `제주 ${won(SHIPPING.jejuExtraKrw)} · 도서산간 ${won(SHIPPING.islandExtraKrw)} 추가 (무료 배송 주문 포함)`,
  dispatch: "주문 후 제작해 상품마다 표시된 제작 기간 뒤에 CJ대한통운으로 발송합니다. 발송하면 송장번호를 메일로 알려 드립니다.",
  exchange: `사이즈 교환 · 반품은 받은 다음 날부터 ${SHIPPING.changeOfMindDays}일 안에 마이페이지에서 신청합니다.`,
  exchangeFee: `단순 변심 · 사이즈 교환은 왕복 배송비 ${won(SHIPPING.changeOfMindRoundTripKrw)}을 손님이 부담합니다. 불량 · 오배송은 저희가 부담합니다.`,
  condition: "착용 · 세탁 · 수선한 흔적이 없고 택과 포장이 그대로여야 교환 · 반품할 수 있습니다.",
} as const;

export const wonText = won;
