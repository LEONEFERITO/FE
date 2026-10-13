"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { CATEGORY_NAV } from "@/data/categories";
import { CATEGORY_GROUPS, type NavGroup } from "@/data/siteNav";
import type { Category } from "@/types/product";

/**
 * 분류 메뉴 순서를 화면 전체에 나눠 준다 (관리자 › 분류 순서, 서버 V27).
 *
 * 순서는 빌드 때 루트 레이아웃이 받아(lib/categoryOrder) 여기에 넣는다. 헤더는 클라이언트 컴포넌트라
 * 빌드 때 받은 값을 직접 읽을 수 없어서, 이 맥락으로 받는다. 맥락이 없으면(테스트 · 미리보기) 코드의 순서다.
 */

const CategoryOrderContext = createContext<Category[] | null>(null);

export function CategoryOrderProvider({ order, children }: { order: Category[]; children: ReactNode }) {
  return <CategoryOrderContext.Provider value={order}>{children}</CategoryOrderContext.Provider>;
}

/** 헤더 분류 메뉴 — 관리자가 정한 순서대로 */
export function useCategoryGroups(): NavGroup[] {
  const order = useContext(CategoryOrderContext);
  return useMemo(() => {
    if (!order) return CATEGORY_GROUPS;
    // CATEGORY_GROUPS 는 CATEGORY_NAV 와 같은 순서로 만들어진다(data/siteNav) — 자리로 분류를 찾는다
    const rank = (i: number) => {
      const r = order.indexOf(CATEGORY_NAV[i].category);
      return r < 0 ? order.length + i : r;
    };
    return CATEGORY_GROUPS.map((g, i) => ({ g, r: rank(i) }))
      .sort((a, b) => a.r - b.r)
      .map(({ g }) => g);
  }, [order]);
}
