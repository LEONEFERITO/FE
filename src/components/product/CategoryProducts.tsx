"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { ProductBrowser, type Facet, type Selection } from "@/components/product/ProductBrowser";
import { matchesSub, subHref, type CategorySub } from "@/data/categories";
import { LINE_LABEL, type Product, type ProductLine } from "@/types/product";

/**
 * 분류 페이지의 상품 — 세부 분류 · 라인 · 사이즈 · 재고로 거르고 정렬한다. 틀은 ProductBrowser (2026-10-08 LYFT 구성).
 *
 * 세부 분류(?sub=)는 헤더 드롭다운이 거는 **공유되는 주소**다 — 고르면 주소도 같이 맞춘다(replaceState).
 * 정적 내보내기라 쿼리는 브라우저에서만 읽힌다. 그래서 페이지는 CategoryProductsFromUrl 을 Suspense 로 감싸고,
 * 빌드 HTML(= 대체 화면)에는 분류 전체를 그린다 — 검색엔진과 JS 없는 환경에는 전체 목록이 보인다.
 *
 * 카드는 목록 · 메인과 **같은 카드**다. 분류 페이지 전용 카드를 만들면 실측 표기가 세 군데로 갈라진다.
 */

const LINES: ProductLine[] = ["LEONE", "FERITO"];

export function CategoryProductsFromUrl(props: { products: Product[]; categorySlug: string; subs: CategorySub[] }) {
  const sub = useSearchParams().get("sub");
  return <CategoryProducts {...props} activeSub={props.subs.some((s) => s.slug === sub) ? sub : null} />;
}

export function CategoryProducts({
  products,
  categorySlug,
  subs = [],
  activeSub = null,
}: {
  products: Product[];
  categorySlug?: string;
  subs?: CategorySub[];
  activeSub?: string | null;
}) {
  const sizes = useMemo(() => [...new Set(products.flatMap((p) => p.skus.map((s) => s.size)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [products]);

  const facets = useMemo<Facet[]>(() => {
    const list: Facet[] = [];
    if (subs.length > 0) {
      list.push({
        key: "sub",
        label: "세부 분류",
        options: subs.map((s) => ({ value: s.slug, label: s.label, test: (p) => matchesSub(p, s) })),
      });
    }
    list.push(
      {
        key: "line",
        label: "라인",
        options: LINES.map((l) => ({ value: l, label: LINE_LABEL[l].ko, test: (p) => p.line === l })),
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
    );
    return list;
  }, [subs, sizes]);

  // 세부 분류만 주소에 쓴다 — 나머지 조건은 이 화면 안의 것이다
  const urlFor = useCallback(
    (sel: Selection) => {
      if (!categorySlug) return undefined;
      return sel.sub ? subHref(categorySlug, sel.sub) : `/category/${categorySlug}/`;
    },
    [categorySlug],
  );

  return (
    <ProductBrowser key={activeSub ?? ""} products={products} facets={facets} initial={{ sub: activeSub }} urlFor={urlFor} />
  );
}
