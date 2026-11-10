import type { Category } from "@/types/product";

/**
 * 수량 단위 — 옷은 «벌», 신발은 «켤레»(2026-11-10 고객 "신발은 1벌이 아니라 1켤레로").
 * 상품 화면(고른 옵션 합계 · 담기 알림 · 남은 수량)이 쓴다. 서버의 품절 · 남은 수량 문구도 같은 기준(CartService.stockMessage).
 */
export const unitOf = (category: Category): string => (category === "SHOES" ? "켤레" : "벌");
