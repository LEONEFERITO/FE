import { CATEGORY_NAV } from "@/data/categories";
import type { Category } from "@/types/product";

/**
 * 분류 메뉴 순서 — **빌드할 때** 서버에서 받는다 (서버 category_order V27, 관리자 › 분류 순서).
 *
 * 헤더(PC · 모바일 메뉴)와 제품 목록의 분류 필터가 이 순서로 놓는다. 관리자가 저장하면 서버가 화면을 다시 만든다.
 * API 주소가 없으면(화면 확인 단계) 코드의 순서(CATEGORY_NAV), 주소가 있는데 응답하지 않으면 빌드를 실패시킨다.
 * 서버가 모르는 분류가 와도 버리고, 서버가 빠뜨린 분류는 맨 뒤에 붙인다 — 메뉴에서 분류가 사라지지 않게.
 *
 * 이 파일은 서버 컴포넌트(빌드)에서만 쓴다.
 */

const DEFAULT: Category[] = CATEGORY_NAV.map((c) => c.category);

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
// 빌드 때 받아 오는 주소 — 서버의 빌더는 내부 주소(API_BUILD_BASE)를 준다. lib/catalog.ts 참고
const FETCH_BASE = process.env.API_BUILD_BASE || API_BASE;

async function load(): Promise<Category[]> {
  const res = await fetch(`${FETCH_BASE}/api/products/category-order`);
  if (!res.ok) {
    throw new Error(`분류 순서 API 응답 실패: ${res.status}`);
  }
  const body = (await res.json()) as { categories?: string[] };
  const known = (body.categories ?? []).filter((c): c is Category => DEFAULT.includes(c as Category));
  return [...known, ...DEFAULT.filter((c) => !known.includes(c))];
}

let memo: Promise<Category[]> | null = null;

export function getCategoryOrder(): Promise<Category[]> {
  if (!API_BASE) return Promise.resolve(DEFAULT);
  if (process.env.NODE_ENV !== "production") return load();
  memo ??= load();
  return memo;
}

/** 순서대로 정렬 — 순서에 없는 값은 뒤로 */
export function byCategoryOrder<T>(items: T[], order: Category[], key: (item: T) => Category): T[] {
  const rank = (c: Category) => {
    const i = order.indexOf(c);
    return i < 0 ? order.length : i;
  };
  return [...items].sort((a, b) => rank(key(a)) - rank(key(b)));
}
