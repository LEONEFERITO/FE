"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { loginUrl } from "@/lib/auth";
import { SHOP_CONNECTED, ShopError, addToCart, type Cart } from "@/lib/shop";
import { heelLabel, parseHeelLabel } from "@/lib/heel";
import { isSuitSet, parseSuitLabel, suitDefaults, suitLabel, suitPrice } from "@/lib/suit";
import type { Product } from "@/types/product";

/**
 * 담기 · 바로 구매 — 구매 판(PurchasePanel)과 빠른 보기 팝업(QuickView)이 같은 규칙을 쓴다.
 *
 * 회원만 주문한다(D1) — 로그인이 필요하면 로그인 화면으로 보냈다가 이 상품으로 다시 돌아오게 한다.
 *
 * ── 고른 옵션 목록 (2026-11-03 고객 "컬러와 사이즈 선택 후 각각 구매 수량") ──
 * 구매 판은 컬러 · 사이즈를 고를 때마다 «고른 옵션» 줄이 하나씩 생기고(국내 쇼핑몰 방식), 줄마다 수량을 정한다.
 * 같은 컬러 · 사이즈를 또 고르면 그 줄의 수량이 는다. 담기 · 바로 구매는 줄 전부를 한 번에 가져간다.
 * 빠른 보기 팝업은 줄 없이 한 벌 — 고른 사이즈(와 컬러)로 1벌을 담는다.
 *
 * 2026-10-08 PurchasePanel 에서 떼어 냈다 — 팝업이 생기면서 두 군데가 됐고, 한쪽만 고쳐지는 날을 막는다.
 */

/** 한 줄 최대 수량 — 서버 CartItem.MAX_QUANTITY 와 같다 */
export const MAX_LINE_QUANTITY = 10;

export interface PickedLine {
  /** 보통 사이즈는 "L", 수트 구성은 "3피스 · 자켓 L / 베스트 M / 팬츠 L", 굽높이 옵션(V49)은 "270 · 굽 +3cm" */
  size: string;
  /** 컬러 이름. 컬러가 없는 상품은 빈 값 */
  color: string;
  quantity: number;
}

/** 한 벌 값 — 보통 상품은 판매가, 수트 구성은 고른 구성의 값 */
export function unitPriceOf(product: Product, size: string): number | null {
  if (!isSuitSet(product)) return product.priceKrw;
  const parsed = parseSuitLabel(size);
  return parsed ? suitPrice(product, parsed.set) : null;
}

/** 이 줄을 몇 벌까지 담을 수 있나 — 남은 수량을 알면(5벌 이하) 그만큼, 아니면 10벌 */
export function lineMax(product: Product, size: string): number {
  if (isSuitSet(product)) return MAX_LINE_QUANTITY;
  // 굽높이 옵션은 사이즈(270)의 남은 수량을 본다
  const base = product.heels?.length ? (parseHeelLabel(size)?.size ?? size) : size;
  const remaining = product.skus.find((s) => s.size === base && !s.piece)?.remaining;
  return remaining != null ? Math.min(remaining, MAX_LINE_QUANTITY) : MAX_LINE_QUANTITY;
}

export function usePurchase(product: Product) {
  const suit = isSuitSet(product);
  const colors = product.colors ?? [];
  const heels = product.heels ?? [];
  // 굽높이(V49) — 처음에는 «기본». 구매 판 · 빠른 보기 모두 이 값으로 사이즈 줄을 만든다
  const [selectedHeel, setSelectedHeel] = useState<string | null>(() => heels[0] ?? null);
  /** 담을 사이즈 줄 — 굽높이 옵션 상품이면 "270 · 굽 +3cm" */
  const withHeel = (size: string) => (heels.length > 0 ? heelLabel(size, selectedHeel ?? heels[0]) : size);
  // 빠른 보기 팝업의 한 벌 선택 — 수트 구성(lib/suit)은 "3피스 · 자켓 L / 베스트 M / 팬츠 L" 한 줄이 곧 사이즈다
  const [selectedSize, setSelectedSize] = useState<string | null>(() => {
    if (!suit) return product.skus.find((s) => s.orderable)?.size ?? null;
    const d = suitDefaults(product);
    return d.set ? suitLabel(d.set, d.sizes) : null;
  });
  // 컬러가 하나뿐이면 처음부터 골라 둔다 — 고를 것이 없는데 누르게 하지 않는다
  const [selectedColor, setSelectedColor] = useState<string | null>(() => (colors.length === 1 ? colors[0].name : null));
  // 구매 판의 «고른 옵션» 줄. 사이즈가 하나뿐이고 컬러가 없는 상품(액세서리 등)은 처음부터 한 줄을 넣어 둔다
  const [lines, setLines] = useState<PickedLine[]>(() => {
    const orderable = product.skus.filter((s) => s.orderable && !s.piece);
    return !suit && colors.length === 0 && heels.length === 0 && orderable.length === 1 && product.skus.length === 1
      ? [{ size: orderable[0].size, color: "", quantity: 1 }]
      : [];
  });
  const router = useRouter();
  const [pending, setPending] = useState<"cart" | "buy" | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  /** 줄 하나를 더한다 — 같은 컬러 · 사이즈가 있으면 수량 +1(상한까지). 컬러가 있는 상품인데 컬러를 안 골랐으면 알린다 */
  function addLine(size: string, color: string | null = selectedColor) {
    if (colors.length > 0 && !color) {
      setNotice({ tone: "error", text: "컬러를 먼저 골라 주세요." });
      return false;
    }
    setNotice(null);
    const c = color ?? "";
    size = withHeel(size);
    setLines((cur) => {
      const i = cur.findIndex((l) => l.size === size && l.color === c);
      if (i < 0) return [...cur, { size, color: c, quantity: 1 }];
      return cur.map((l, k) => (k === i ? { ...l, quantity: Math.min(l.quantity + 1, lineMax(product, size)) } : l));
    });
    return true;
  }

  function setQuantity(index: number, quantity: number) {
    setLines((cur) =>
      cur.map((l, k) => (k === index ? { ...l, quantity: Math.max(1, Math.min(quantity, lineMax(product, l.size))) } : l)),
    );
  }

  function removeLine(index: number) {
    setLines((cur) => cur.filter((_, k) => k !== index));
  }

  /** 담을 것 — 구매 판은 고른 줄 전부, 빠른 보기는 고른 한 벌 */
  function toPut(useLines: boolean): PickedLine[] {
    if (useLines) return lines;
    return selectedSize ? [{ size: withHeel(selectedSize), color: selectedColor ?? "", quantity: 1 }] : [];
  }

  async function put(mode: "cart" | "buy", useLines = true) {
    const picked = toPut(useLines);
    if (picked.length === 0) return;
    if (colors.length > 0 && picked.some((l) => !l.color)) {
      setNotice({ tone: "error", text: "컬러를 골라 주세요." });
      return;
    }
    if (!SHOP_CONNECTED) {
      setNotice({ tone: "error", text: "화면 확인 단계입니다. 주문 서버가 아직 연결되지 않았습니다." });
      return;
    }
    setPending(mode);
    setNotice(null);
    try {
      // 줄마다 차례로 담는다 — 서버가 줄마다 재고 · 컬러를 다시 본다. 실패하면 그 줄의 이유를 그대로 보여 준다
      let cart: Cart | null = null;
      for (const l of picked) {
        cart = await addToCart(product.slug, l.size, l.quantity, l.color);
      }
      if (mode === "buy" && cart) {
        const ids = picked
          .map((l) => cart!.items.find((c) => c.slug === product.slug && c.size === l.size && (c.color ?? "") === l.color)?.id)
          .filter((id): id is string => !!id);
        router.push(ids.length ? `/checkout/?items=${ids.map(encodeURIComponent).join(",")}` : "/cart/");
        return;
      }
      const count = picked.reduce((n, l) => n + l.quantity, 0);
      setNotice({ tone: "ok", text: `${count}벌을 장바구니에 담았습니다.` });
      if (useLines) setLines([]);
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

  return {
    selectedSize,
    setSelectedSize,
    selectedColor,
    setSelectedColor,
    selectedHeel,
    setSelectedHeel,
    lines,
    addLine,
    setQuantity,
    removeLine,
    pending,
    notice,
    put,
  };
}
