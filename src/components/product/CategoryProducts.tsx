"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";

import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types/product";

/**
 * 카테고리 페이지의 상품 줄 — "총 N개의 상품" · 정렬 · 격자 (2026-10-05 고객 디자인 가이드).
 *
 * 기준은 기존 몰의 분류 페이지다(leoneferito.kr/category/Shirts/45/): 왼쪽에 개수, 오른쪽에 정렬,
 * 그 아래 격자. 정렬만 브라우저에서 돈다 — 상품 정보 자체는 서버 컴포넌트가 HTML 에 박아 내보낸다
 * (이 컴포넌트도 첫 화면은 정적 HTML 로 나간다. 검색엔진은 JS 없이 상품명을 읽는다).
 *
 * 카드는 목록 · 메인과 **같은 카드**다. 분류 페이지 전용 카드를 만들면 실측 표기가 세 군데로 갈라진다.
 *
 * 정렬 선택지는 기존 몰에서 우리가 값을 가진 것만 옮겼다(신상품 · 상품명 · 낮은가격 · 높은가격).
 * 제조사 · 사용후기순은 그 값이 없어 뺐다 — 눌러도 안 바뀌는 선택지는 고장으로 읽힌다.
 */

type Sort = "new" | "name" | "price-asc" | "price-desc";

const SORTS: { value: Sort; label: string }[] = [
  { value: "new", label: "신상품" },
  { value: "name", label: "상품명" },
  { value: "price-asc", label: "낮은가격" },
  { value: "price-desc", label: "높은가격" },
];

export function CategoryProducts({ products }: { products: Product[] }) {
  const [sort, setSort] = useState<Sort>("new");
  const selectId = useId();

  const sorted = useMemo(() => {
    // "신상품" 은 서버가 준 순서 그대로다(관리자가 정한 진열 순서).
    if (sort === "new") return products;
    const list = [...products];
    if (sort === "name") {
      // 이름이 아직 없는 상품은 뒤로. 이름끼리는 한글 사전순.
      list.sort((a, b) => {
        if (a.name === null || b.name === null) return a.name === b.name ? 0 : a.name === null ? 1 : -1;
        return a.name.localeCompare(b.name, "ko");
      });
    } else {
      // 가격 문의(= null) 상품은 어느 방향이든 뒤로 — "낮은가격" 맨 앞에 가격 없는 상품이 오면 틀린 답이다.
      const dir = sort === "price-asc" ? 1 : -1;
      list.sort((a, b) => {
        if (a.priceKrw === null || b.priceKrw === null) {
          return a.priceKrw === b.priceKrw ? 0 : a.priceKrw === null ? 1 : -1;
        }
        return (a.priceKrw - b.priceKrw) * dir;
      });
    }
    return list;
  }, [products, sort]);

  return (
    <div>
      <div className="border-subtle flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <p className="text-secondary text-sm">
          총 <strong className="text-primary font-semibold tabular-nums">{products.length}</strong>개의 상품
        </p>

        {/* 상품이 하나뿐이면 정렬할 것이 없다 */}
        {products.length > 1 && (
          <div className="flex items-center gap-3">
            <label htmlFor={selectId} className="text-muted text-xs">
              정렬
            </label>
            <select
              id={selectId}
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="border-interactive bg-surface text-primary min-h-11 rounded-full border px-4 text-xs"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {sorted.length > 0 ? (
        <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
          {sorted.map((p) => (
            <li key={p.slug}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      ) : (
        /*
          상품이 없는 분류. 같은 레이아웃(제목 · 개수 줄)은 그대로 두고 격자 자리에만 안내를 둔다.
          "준비 중" 딱지 대신 갈 곳을 준다 — 빈 화면에서 끝나면 뒤로 가기밖에 할 것이 없다.
        */
        <div className="flex flex-col items-center gap-5 py-24 text-center">
          <p className="text-secondary text-sm">이 분류의 상품을 준비하고 있습니다.</p>
          <Link
            href="/products/"
            className="border-interactive text-accent hover:border-accent hover:bg-accent-tint ease-fluid tracking-button inline-flex min-h-11 items-center rounded-full border px-6 text-xs transition-all duration-500"
          >
            전체 제품 보기
          </Link>
        </div>
      )}
    </div>
  );
}
