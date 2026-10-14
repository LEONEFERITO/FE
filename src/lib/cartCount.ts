"use client";

import { useSyncExternalStore } from "react";

/**
 * 헤더의 CART (n) — 장바구니 줄 수. 장바구니를 부르는 모든 API(lib/shop.ts getCart · addToCart · 수량 · 삭제)가
 * 돌려받은 장바구니로 이 값을 고친다. 그래서 담기 · 지우기 즉시 헤더가 따라온다.
 * 로그인 전이거나 서버가 없으면 0. 처음 값은 헤더가 마운트될 때 한 번 불러 온다(Header).
 */
let count = 0;
const listeners = new Set<() => void>();

export function publishCartCount(n: number) {
  if (n === count) return;
  count = n;
  listeners.forEach((l) => l());
}

export function useCartCount(): number {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => count,
    () => 0,
  );
}
