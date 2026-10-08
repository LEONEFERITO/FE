"use client";

import { useMemo, useSyncExternalStore } from "react";

import { ProductBrowser, type Facet } from "@/components/product/ProductBrowser";
import { CATEGORY_LABEL, type Category, LINE_LABEL, type Product, type ProductLine } from "@/types/product";

/**
 * 전체 제품(/products) — 라인 · 분류 · 사이즈 · 재고로 거른다. 틀은 ProductBrowser (2026-10-08 LYFT 구성).
 *
 * ── 왜 가격 필터가 없는가 ──────────────────────────────
 * 가격이 미확정(null)인 상품이 있는 동안 가격 슬라이더는 **아무것도 걸러지지 않는 조작 장치**다.
 * 동작하지 않는 컨트롤은 없는 것보다 나쁘다. 가격이 확정되면 그때 넣는다.
 *
 * ── 주소 ──────────────────────────────────────────────
 * 메인의 분류 격자가 `/products?category=JACKET` 로 들어온다 — **들어올 때 한 번만** 읽는다.
 * useSearchParams 는 정적 내보내기에서 Suspense 경계를 요구하고, effect 는 렌더가 한 번 더 돈다.
 * URL 은 React 밖의 값이라 useSyncExternalStore 로 렌더 중에 읽는다. 서버 스냅샷은 null — 정적 HTML 은
 * 전체 목록으로 나가고 하이드레이션 때 React 가 맞춘다. 거른 뒤 주소는 바꾸지 않는다(뒤로가기가 조건을 한 단계씩
 * 푸는 꼴이 된다).
 */

const LINES: ProductLine[] = ["LEONE", "FERITO"];

export function ProductList({
  products,
  categories,
  sizes,
}: {
  products: Product[];
  categories: Category[];
  sizes: string[];
}) {
  const fromUrl = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("category"),
    () => null,
  );
  // 카탈로그에 실제로 있는 값만 받는다. 모르는 값이면 빈 목록이 되는데 그건 "고장" 으로 보인다.
  const initialCategory = fromUrl && categories.includes(fromUrl as Category) ? fromUrl : null;

  const facets = useMemo<Facet[]>(
    () => [
      {
        key: "line",
        label: "라인",
        options: LINES.map((l) => ({ value: l, label: LINE_LABEL[l].ko, test: (p) => p.line === l })),
      },
      {
        key: "category",
        label: "분류",
        options: categories.map((c) => ({ value: c, label: CATEGORY_LABEL[c].ko, test: (p) => p.category === c })),
      },
      {
        key: "size",
        label: "사이즈",
        options: sizes.map((s) => ({ value: s, label: s, test: (p) => p.skus.some((k) => k.size === s) })),
      },
      {
        key: "stock",
        label: "재고",
        options: [
          { value: "in", label: "재고 있음", test: (p) => p.skus.some((k) => k.orderable) },
          { value: "out", label: "품절", test: (p) => p.skus.length > 0 && p.skus.every((k) => !k.orderable) },
        ],
      },
    ],
    [categories, sizes],
  );

  return <ProductBrowser key={initialCategory ?? ""} products={products} facets={facets} initial={{ category: initialCategory }} />;
}
