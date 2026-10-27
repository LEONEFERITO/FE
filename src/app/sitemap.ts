import type { MetadataRoute } from "next";

import { CATEGORY_NAV, categoryHref } from "@/data/categories";
import { getCatalog } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";

/**
 * sitemap.xml — 손님이 검색으로 들어올 공개 페이지만. 로그인 · 주문 · 관리자 화면은 넣지 않는다.
 *
 * 도메인(NEXT_PUBLIC_SITE_URL)이 없으면 빈 목록이다. robots.ts 가 이 주소를 크롤러에 알린다(2026-10-26 검색 허용).
 */
export const dynamic = "force-static";

const PAGES = [
  "/",
  "/products/",
  // 분류 · 라인 페이지 (2026-10-05). 분류 목록은 내비와 같은 곳에서 온다.
  ...CATEGORY_NAV.map((c) => categoryHref(c.slug)),
  "/line/leone/",
  "/line/ferito/",
  "/brand/",
  "/lookbook/",
  "/guide/",
  "/qna/",
  "/notice/",
  // 약관 · 개인정보처리방침 · 쿠키 정책은 noindex 라 넣지 않는다 — 색인 막은 주소를 지도에 올리면 서치콘솔이 오류로 센다
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!SITE_URL) return [];
  const products = await getCatalog();
  return [
    ...PAGES.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...products.map((p) => ({ url: `${SITE_URL}/products/${p.slug}/` })),
  ];
}
