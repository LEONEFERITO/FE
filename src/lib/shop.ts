/**
 * 장바구니 · 주문 · 결제 경계면.
 *
 * 규칙은 lib/auth.ts 와 같다 — 쿠키 세션, CSRF 토큰, 서버가 진짜 기준.
 * **금액은 서버가 계산한다.** 이 파일은 서버가 준 금액을 결제창에 그대로 넘길 뿐,
 * 합계를 스스로 더하지 않는다. 서버도 승인 직전에 저장된 금액과 다시 대조한다.
 *
 * 결제창은 토스페이먼츠 공식 SDK(@tosspayments/tosspayments-sdk)로 연다.
 * 클라이언트 키(test_ck_ / live_ck_)는 공개 값이라 빌드에 박혀도 된다. 시크릿 키는 서버에만 있다.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
export const SHOP_CONNECTED = API_BASE.length > 0;

/** 토스 클라이언트 키. 비어 있으면 결제 버튼을 열지 않는다(결제 준비 중). */
export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

export class ShopError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 0,
  ) {
    super(message);
    this.name = "ShopError";
  }

  get needsLogin(): boolean {
    return this.status === 401;
  }
}

async function csrfHeader(): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE}/api/auth/csrf`, { credentials: "include" });
  if (!res.ok) throw new ShopError("NETWORK", "연결에 실패했습니다.");
  const body: { headerName: string; token: string } = await res.json();
  return { [body.headerName]: body.token };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!SHOP_CONNECTED) {
    throw new ShopError("NOT_CONNECTED", "주문 서버가 아직 연결되지 않았습니다.");
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers:
        method === "GET"
          ? undefined
          : { "Content-Type": "application/json", ...(await csrfHeader()) },
      body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
    });
  } catch (e) {
    if (e instanceof ShopError) throw e;
    throw new ShopError("NETWORK", "연결에 실패했습니다. 네트워크를 확인해 주세요.");
  }
  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }
  let code = "UNKNOWN";
  let message = "처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  try {
    const err = await res.json();
    code = err.code ?? code;
    // 서버 문구를 보여준다 — 장바구니·결제 오류는 손님이 무엇을 할지 알아야 한다
    // ("이 사이즈는 지금 주문할 수 없습니다", "카드사에서 거절했습니다").
    if (err.message) message = err.message;
  } catch {
    // 본문이 없을 수 있다
  }
  if (res.status === 401) message = "로그인이 필요합니다.";
  throw new ShopError(code, message, res.status);
}

// ── 장바구니 ────────────────────────────────────────────────

export interface CartLine {
  id: string;
  slug: string | null;
  name: string | null;
  imageUrl: string | null;
  size: string;
  quantity: number;
  unitPriceKrw: number | null;
  lineAmountKrw: number;
  leadTimeDays: number | null;
  /** 지금 주문할 수 있는가. 아니면 unavailableReason 을 보여 주고 합계에서 뺀다. */
  available: boolean;
  unavailableReason: string | null;
}

export interface Cart {
  items: CartLine[];
  itemsAmountKrw: number;
  /** null 이면 배송비 정책이 아직 없다 — 주문 불가. */
  shippingFeeKrw: number | null;
  totalAmountKrw: number | null;
  shippingPolicyReady: boolean;
  freeShippingThresholdKrw: number | null;
}

export const MAX_QUANTITY = 10;

export const getCart = () => request<Cart>("GET", "/api/cart");
export const addToCart = (slug: string, size: string, quantity = 1) =>
  request<Cart>("POST", "/api/cart/items", { slug, size, quantity });
export const changeCartQuantity = (id: string, quantity: number) =>
  request<Cart>("PATCH", `/api/cart/items/${encodeURIComponent(id)}`, { quantity });
export const removeCartLine = (id: string) =>
  request<Cart>("DELETE", `/api/cart/items/${encodeURIComponent(id)}`);

// ── 주문 ────────────────────────────────────────────────────

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "IN_PRODUCTION"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "결제 대기",
  PAID: "결제 완료",
  IN_PRODUCTION: "제작 중",
  SHIPPED: "발송",
  DELIVERED: "배송 완료",
  CANCELLED: "취소",
};

/** 진행 단계 — 손님 주문 상세의 단계 표시 순서. 취소는 따로 표시한다. */
export const ORDER_STEPS: OrderStatus[] = ["PAID", "IN_PRODUCTION", "SHIPPED", "DELIVERED"];

export interface Recipient {
  name: string;
  phone: string;
  zipCode: string;
  address1: string;
  address2: string | null;
  memo: string | null;
}

export interface OrderSummary {
  orderNumber: string;
  status: OrderStatus;
  orderName: string;
  totalAmountKrw: number;
  itemCount: number;
  imageUrl: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface OrderDetail {
  orderNumber: string;
  status: OrderStatus;
  orderName: string;
  itemsAmountKrw: number;
  shippingFeeKrw: number;
  totalAmountKrw: number;
  refundedAmountKrw: number;
  items: {
    /** 교환·반품 신청에서 어느 줄인지 가리킨다 */
    id: string;
    slug: string;
    name: string;
    imageUrl: string | null;
    size: string;
    unitPriceKrw: number;
    quantity: number;
    lineAmountKrw: number;
    leadTimeDays: number;
  }[];
  recipient: Recipient;
  paymentMethod: string | null;
  paidAt: string | null;
  courier: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  events: { status: OrderStatus; note: string | null; at: string }[];
  /** 지금 손님이 직접 취소할 수 있는가 (결제 완료 · 제작 전) */
  cancellable: boolean;
  /** 이 주문의 교환·반품 신청 (최신순) */
  returns: ReturnView[];
  /** 지금 교환·반품을 신청할 수 있는가 (배송 완료 · 기간 안 · 진행 중인 신청 없음) */
  returnable: boolean;
  /** 단순 변심·사이즈 신청 마감 (그 시각 전까지). 배송 완료 전이면 null */
  changeOfMindDeadline: string | null;
  /** 불량·오배송 신청 마감 */
  sellerFaultDeadline: string | null;
}

export interface CreateOrderInput {
  cartItemIds: string[];
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  address1: string;
  address2: string | null;
  deliveryMemo: string | null;
  agree: boolean;
}

export interface CreatedOrder {
  orderNumber: string;
  orderName: string;
  /** 서버가 계산한 결제 금액. 결제창에 이 값을 그대로 넘긴다. */
  amount: number;
  customerKey: string;
  customerName: string;
  customerEmail: string;
}

export interface Quote {
  itemsAmountKrw: number;
  shippingFeeKrw: number;
  totalAmountKrw: number;
  longestLeadTimeDays: number;
}

/** 주문서 화면 금액 — 고른 줄로 서버가 계산한다(주문서 작성과 같은 계산). */
export const quoteOrder = (cartItemIds: string[]) =>
  request<Quote>("POST", "/api/orders/quote", { cartItemIds });

export const paymentReadiness = () =>
  request<{ paymentReady: boolean }>("GET", "/api/orders/readiness");
export const createOrder = (input: CreateOrderInput) =>
  request<CreatedOrder>("POST", "/api/orders", input);
export const confirmOrder = (orderNumber: string, paymentKey: string, amount: number) =>
  request<OrderDetail>("POST", `/api/orders/${encodeURIComponent(orderNumber)}/confirm`, {
    paymentKey,
    amount,
  });
export const cancelOrder = (orderNumber: string) =>
  request<OrderDetail>("POST", `/api/orders/${encodeURIComponent(orderNumber)}/cancel`);
export const myOrders = () => request<OrderSummary[]>("GET", "/api/orders");
export const myOrder = (orderNumber: string) =>
  request<OrderDetail>("GET", `/api/orders/${encodeURIComponent(orderNumber)}`);

/**
 * 토스 결제창을 연다. 성공하면 토스가 /order/success/ 로, 실패·취소하면 /order/fail/ 로 보낸다
 * (주소에 paymentKey · orderId · amount 또는 code · message 가 붙는다).
 *
 * SDK 는 이 함수를 부를 때만 불러온다 — 결제하지 않는 화면에 결제 스크립트를 싣지 않는다.
 */
export async function openPaymentWindow(order: CreatedOrder, phone: string): Promise<void> {
  const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
  const toss = await loadTossPayments(TOSS_CLIENT_KEY);
  const payment = toss.payment({ customerKey: order.customerKey });
  const origin = window.location.origin;
  await payment.requestPayment({
    method: "CARD",
    amount: { currency: "KRW", value: order.amount },
    orderId: order.orderNumber,
    orderName: order.orderName,
    successUrl: `${origin}/order/success/`,
    failUrl: `${origin}/order/fail/`,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerMobilePhone: phone.replace(/[^0-9]/g, "") || null,
  });
}

// ── 교환 · 반품 ────────────────────────────────────────────

export type ReturnType = "EXCHANGE" | "RETURN";
export type ReturnReason = "SIZE" | "CHANGE_OF_MIND" | "DEFECT" | "WRONG_ITEM" | "OTHER";
export type ReturnStatus = "REQUESTED" | "APPROVED" | "COLLECTED" | "COMPLETED" | "REJECTED" | "WITHDRAWN";

export const RETURN_TYPE_LABEL: Record<ReturnType, string> = { EXCHANGE: "교환", RETURN: "반품" };

export const RETURN_REASON_LABEL: Record<ReturnReason, string> = {
  SIZE: "사이즈가 맞지 않음",
  CHANGE_OF_MIND: "단순 변심",
  DEFECT: "상품 불량 · 파손",
  WRONG_ITEM: "다른 상품이 옴 (오배송)",
  OTHER: "기타",
};

/** 판매자 책임 사유 — 신청 기간이 더 길다 (서버 ReturnReason.sellerFault 와 같다). */
export const SELLER_FAULT: ReturnReason[] = ["DEFECT", "WRONG_ITEM"];

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  REQUESTED: "신청",
  APPROVED: "승인 · 회수 대기",
  COLLECTED: "회수 완료",
  COMPLETED: "완료",
  REJECTED: "거절",
  WITHDRAWN: "철회",
};

/** 진행 단계 — 손님 화면의 단계 표시 순서. 거절·철회는 따로 표시한다. */
export const RETURN_STEPS: ReturnStatus[] = ["REQUESTED", "APPROVED", "COLLECTED", "COMPLETED"];

export interface ReturnView {
  id: string;
  orderNumber: string;
  type: ReturnType;
  reason: ReturnReason;
  detail: string | null;
  status: ReturnStatus;
  /** 관리자 안내 (회수 방법 · 일정) */
  adminNote: string | null;
  rejectReason: string | null;
  refundAmountKrw: number;
  reshipCourier: string | null;
  reshipTrackingNumber: string | null;
  createdAt: string;
  items: { orderItemId: string; name: string; imageUrl: string | null; size: string; unitPriceKrw: number; quantity: number; exchangeSize: string | null }[];
  events: { status: ReturnStatus; note: string | null; at: string }[];
  /** 지금 손님이 철회할 수 있는가 (승인 전) */
  withdrawable: boolean;
}

export interface ReturnInput {
  type: ReturnType;
  reason: ReturnReason;
  detail: string | null;
  items: { orderItemId: string; quantity: number; exchangeSize: string | null }[];
}

export const requestReturn = (orderNumber: string, input: ReturnInput) =>
  request<ReturnView>("POST", `/api/orders/${encodeURIComponent(orderNumber)}/returns`, input);
export const withdrawReturn = (id: string) =>
  request<ReturnView>("POST", `/api/returns/${encodeURIComponent(id)}/withdraw`);

/** 교환받을 사이즈 — 지금 주문할 수 있는 사이즈만. 공개 상품 API 에서 읽는다. */
export async function orderableSizes(slug: string): Promise<string[]> {
  const p = await request<{ skus: { size: string; orderable: boolean }[] }>(
    "GET",
    `/api/products/${encodeURIComponent(slug)}`,
  );
  return p.skus.filter((s) => s.orderable).map((s) => s.size);
}

export interface AdminReturnRow {
  id: string;
  orderNumber: string;
  orderName: string;
  recipientName: string;
  type: ReturnType;
  reason: ReturnReason;
  status: ReturnStatus;
  itemCount: number;
  createdAt: string;
}

export interface AdminReturnPage {
  items: AdminReturnRow[];
  page: number;
  totalPages: number;
  totalElements: number;
}

export interface AdminReturnDetail {
  request: ReturnView;
  orderName: string;
  orderTotalKrw: number;
  /** 이 주문에서 아직 돌려주지 않은 금액 — 환불액 상한 */
  refundableKrw: number;
  recipient: Recipient;
  events: { from: ReturnStatus | null; to: ReturnStatus; note: string | null; byAdmin: boolean; at: string }[];
}

/** open = 처리할 것만 (신청 · 승인 · 회수) */
export function adminReturns(q: { status: ReturnStatus | null; open: boolean; page: number }) {
  const params = new URLSearchParams({ page: String(q.page), open: String(q.open) });
  if (q.status) params.set("status", q.status);
  return request<AdminReturnPage>("GET", `/api/admin/returns?${params}`);
}
export const adminReturn = (id: string) =>
  request<AdminReturnDetail>("GET", `/api/admin/returns/${encodeURIComponent(id)}`);
export const adminApproveReturn = (id: string, note: string) =>
  request<void>("POST", `/api/admin/returns/${encodeURIComponent(id)}/approve`, { note });
export const adminCollectReturn = (id: string) =>
  request<void>("POST", `/api/admin/returns/${encodeURIComponent(id)}/collected`, {});
export const adminRejectReturn = (id: string, reason: string) =>
  request<void>("POST", `/api/admin/returns/${encodeURIComponent(id)}/reject`, { reason });
export const adminRefundReturn = (id: string, refundAmountKrw: number) =>
  request<void>("POST", `/api/admin/returns/${encodeURIComponent(id)}/refund`, { refundAmountKrw });
export const adminReshipReturn = (id: string, courier: string, trackingNumber: string) =>
  request<void>("POST", `/api/admin/returns/${encodeURIComponent(id)}/reship`, { courier, trackingNumber });

// ── 관리자 주문 ─────────────────────────────────────────────

export interface AdminOrderRow {
  orderNumber: string;
  status: OrderStatus;
  orderName: string;
  totalAmountKrw: number;
  recipientName: string;
  itemCount: number;
  createdAt: string;
  paidAt: string | null;
}

export interface AdminOrderPage {
  items: AdminOrderRow[];
  page: number;
  totalPages: number;
  totalElements: number;
}

export interface AdminOrderDetail {
  order: OrderDetail;
  paymentKey: string | null;
  agreedAt: string;
  events: { from: OrderStatus | null; to: OrderStatus; note: string | null; byAdmin: boolean; at: string }[];
  returns: ReturnView[];
}

export function adminOrders(q: { q: string; status: OrderStatus | null; page: number }) {
  const params = new URLSearchParams({ q: q.q, page: String(q.page) });
  if (q.status) params.set("status", q.status);
  return request<AdminOrderPage>("GET", `/api/admin/orders?${params}`);
}
export const adminOrder = (no: string) =>
  request<AdminOrderDetail>("GET", `/api/admin/orders/${encodeURIComponent(no)}`);
export const adminStartProduction = (no: string) =>
  request<void>("POST", `/api/admin/orders/${encodeURIComponent(no)}/start-production`);
export const adminShip = (no: string, courier: string, trackingNumber: string) =>
  request<void>("POST", `/api/admin/orders/${encodeURIComponent(no)}/ship`, { courier, trackingNumber });
export const adminDeliver = (no: string) =>
  request<void>("POST", `/api/admin/orders/${encodeURIComponent(no)}/deliver`);
export const adminCancelOrder = (no: string, reason: string) =>
  request<void>("POST", `/api/admin/orders/${encodeURIComponent(no)}/cancel`, { reason });

// ── 표시 ────────────────────────────────────────────────────

const KRW = new Intl.NumberFormat("ko-KR");
export const won = (n: number) => `${KRW.format(n)}원`;

const WHEN = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
export const when = (iso: string | null) => (iso ? WHEN.format(new Date(iso)) : "—");

/** 진행 단계 칸처럼 좁은 자리용 — "10. 1." */
const SHORT = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" });
export const shortDate = (iso: string | null) => (iso ? SHORT.format(new Date(iso)) : "");

