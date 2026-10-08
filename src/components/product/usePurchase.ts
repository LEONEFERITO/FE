"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { loginUrl } from "@/lib/auth";
import { SHOP_CONNECTED, ShopError, addToCart } from "@/lib/shop";
import type { Product } from "@/types/product";

/**
 * 담기 · 바로 구매 — 구매 판(PurchasePanel)과 빠른 보기 팝업(QuickView)이 같은 규칙을 쓴다.
 *
 * 회원만 주문한다(D1) — 로그인이 필요하면 로그인 화면으로 보냈다가 이 상품으로 다시 돌아오게 한다.
 * 바로 구매는 담은 그 한 줄만 주문서로 가져간다.
 * 기본 선택은 주문 가능한 첫 사이즈. 주문 가능한 사이즈가 없으면 선택하지 않는다.
 *
 * 2026-10-08 PurchasePanel 에서 떼어 냈다 — 팝업이 생기면서 두 군데가 됐고, 한쪽만 고쳐지는 날을 막는다.
 */
export function usePurchase(product: Product) {
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.skus.find((s) => s.orderable)?.size ?? null,
  );
  const router = useRouter();
  const [pending, setPending] = useState<"cart" | "buy" | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function put(mode: "cart" | "buy") {
    if (!selectedSize) return;
    if (!SHOP_CONNECTED) {
      setNotice({ tone: "error", text: "화면 확인 단계입니다. 주문 서버가 아직 연결되지 않았습니다." });
      return;
    }
    setPending(mode);
    setNotice(null);
    try {
      const cart = await addToCart(product.slug, selectedSize, 1);
      if (mode === "buy") {
        const line = cart.items.find((l) => l.slug === product.slug && l.size === selectedSize);
        router.push(line ? `/checkout/?items=${encodeURIComponent(line.id)}` : "/cart/");
        return;
      }
      setNotice({ tone: "ok", text: `${selectedSize} 사이즈를 장바구니에 담았습니다.` });
    } catch (e) {
      if (e instanceof ShopError && e.needsLogin) {
        window.location.href = loginUrl();
        return;
      }
      setNotice({ tone: "error", text: e instanceof ShopError ? e.message : "담지 못했습니다." });
    } finally {
      setPending(null);
    }
  }

  return { selectedSize, setSelectedSize, pending, notice, put };
}
