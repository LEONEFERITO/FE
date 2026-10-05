/**
 * 관리자 콘솔(대시보드 · 통계 · 공지 · FAQ · 진열 순서) + 손님용 공지 · FAQ 읽기.
 * 요청 규칙은 lib/shop.ts 와 같다 — 쿠키 세션, CSRF, 서버 문구.
 */
import { apiRequest as request } from "@/lib/shop";

// ── 대시보드 ────────────────────────────────────────────────

export interface Day {
  date: string;
  orders: number;
  salesKrw: number;
}

export interface Dashboard {
  /** PAID · IN_PRODUCTION · SHIPPED · RETURN_REQUESTED · RETURN_APPROVED · RETURN_COLLECTED */
  todo: Record<string, number>;
  today: Day;
  /** 최근 14일, 오래된 날부터 */
  days: Day[];
  recent: { orderNumber: string; orderName: string; status: string; totalAmountKrw: number; recipientName: string; paidAt: string }[];
  publishedProducts: number;
  draftProducts: number;
}

export const dashboard = () => request<Dashboard>("GET", "/api/admin/dashboard");

// ── 사이즈별 판매 ───────────────────────────────────────────

export interface SizeRow {
  size: string;
  sold: number;
  returned: number;
  exchangedOut: number;
  exchangedIn: number;
  /** 손님에게 남은 수 = 판매 − 반품 − 교환 나감 + 교환 들어옴 */
  kept: number;
}

export interface SizeStats {
  days: number;
  products: { productId: string; productName: string; sold: number; kept: number; sizes: SizeRow[] }[];
}

export const sizeStats = (days: number) => request<SizeStats>("GET", `/api/admin/stats/sizes?days=${days}`);

// ── 공지 ────────────────────────────────────────────────────

export interface Notice {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeInput {
  title: string;
  body: string;
  pinned: boolean;
  published: boolean;
}

export const NOTICE_LIMITS = { title: 100, body: 5000 } as const;

export const adminNotices = () => request<Notice[]>("GET", "/api/admin/notices");
export const adminNotice = (id: string) => request<Notice>("GET", `/api/admin/notices/${encodeURIComponent(id)}`);
export const createNotice = (input: NoticeInput) => request<Notice>("POST", "/api/admin/notices", input);
export const updateNotice = (id: string, input: NoticeInput) =>
  request<Notice>("PUT", `/api/admin/notices/${encodeURIComponent(id)}`, input);
export const deleteNotice = (id: string) => request<void>("DELETE", `/api/admin/notices/${encodeURIComponent(id)}`);

export interface PublicNoticePage {
  items: { id: string; title: string; pinned: boolean; publishedAt: string }[];
  page: number;
  totalPages: number;
  totalElements: number;
}

export const publicNotices = (page: number) => request<PublicNoticePage>("GET", `/api/notices?page=${page}`);
export const publicNotice = (id: string) => request<Notice>("GET", `/api/notices/${encodeURIComponent(id)}`);

// ── FAQ ────────────────────────────────────────────────────

export type FaqCategory = "ORDER" | "SIZE" | "SHIPPING";

/** QnA 화면의 칩과 같은 이름 */
export const FAQ_CATEGORY_LABEL: Record<FaqCategory, string> = {
  ORDER: "주문 · 제작",
  SIZE: "사이즈",
  SHIPPING: "배송 · 교환",
};

export interface Faq {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  published: boolean;
  sortOrder: number;
}

export interface FaqInput {
  category: FaqCategory;
  question: string;
  answer: string;
  published: boolean;
}

export const FAQ_LIMITS = { question: 200, answer: 3000 } as const;

export const adminFaqs = () => request<Faq[]>("GET", "/api/admin/faqs");
export const createFaq = (input: FaqInput) => request<Faq>("POST", "/api/admin/faqs", input);
export const updateFaq = (id: string, input: FaqInput) =>
  request<Faq>("PUT", `/api/admin/faqs/${encodeURIComponent(id)}`, input);
export const deleteFaq = (id: string) => request<void>("DELETE", `/api/admin/faqs/${encodeURIComponent(id)}`);
export const reorderFaqs = (ids: string[]) => request<Faq[]>("PUT", "/api/admin/faqs/order", { ids });

export const publicFaqs = () => request<Faq[]>("GET", "/api/faqs");

// ── 메인 WHY 구간 ───────────────────────────────────────────

export interface WhyAdminItem {
  id: string | null;
  title: string;
  body: string;
  mediaId: string | null;
  imageUrl: string | null;
}

export interface WhyAdminView {
  eyebrow: string;
  title: string;
  intro: string;
  items: WhyAdminItem[];
}

/** 서버 why_section · why_item 의 CHECK 와 같다 */
export const WHY_LIMITS = { eyebrow: 40, title: 60, intro: 400, itemTitle: 40, itemBody: 300, minItems: 2, maxItems: 5 } as const;

export const adminWhy = () => request<WhyAdminView>("GET", "/api/admin/why");
export const saveWhy = (input: { eyebrow: string; title: string; intro: string; items: { title: string; body: string; mediaId: string | null }[] }) =>
  request<WhyAdminView>("PUT", "/api/admin/why", input);

// ── 사이트 사진 칸 (매장 사진 등) ────────────────────────────

/** 서버의 SiteImageSlot 과 같은 값 (lib/siteImages.ts 의 손님용 타입과도 같다). */
export type SiteImageSlot = "OFFLINE_SHOP";

export interface SiteImageAdminView {
  slot: SiteImageSlot;
  mediaId: string | null;
  imageUrl: string | null;
  alt: string;
}

/** 서버 site_image.alt 의 CHECK 와 같다 */
export const SITE_IMAGE_LIMITS = { alt: 200 } as const;

export const adminSiteImages = () => request<SiteImageAdminView[]>("GET", "/api/admin/site-images");
/** mediaId 가 null 이면 사진을 비운다 — 손님 화면은 기본 사진으로 돌아간다. */
export const saveSiteImage = (slot: SiteImageSlot, input: { mediaId: string | null; alt: string }) =>
  request<SiteImageAdminView>("PUT", `/api/admin/site-images/${slot}`, input);

// ── 진열 순서 (메인 구성) ────────────────────────────────────

/** 공개 상품 id 를 보여 줄 순서대로. 지금 공개 상품 전부여야 한다(아니면 409 — 다시 불러온다). */
export const reorderProducts = (ids: string[]) => request<void>("PUT", "/api/admin/products/order", { ids });

// ── 표시 ────────────────────────────────────────────────────

const DAY = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
export const day = (iso: string | null) => (iso ? DAY.format(new Date(iso)) : "—");
