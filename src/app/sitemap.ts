import type { MetadataRoute } from "next";

import { CATEGORY_NAV, categoryHref } from "@/data/categories";
import { getCatalog } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";

/**
 * sitemap.xml — 손님이 검색으로 들어올 공개 페이지만. 로그인 · 주문 · 관리자 화면은 넣지 않는다.
 *
 * 도메인(NEXT_PUBLIC_SITE_URL)이 없으면 빈 목록이다. 오픈 전에는 public/robots.txt 가 전면 차단 중이라
 * 어차피 읽히지 않는다 — 오픈할 때 robots.txt 를 Allow 로 바꾸고 이 주소를 적는다.
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
  "/guide/",
  "/lookbook/",
  "/qna/",
  "/terms/",
  "/privacy/",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!SITE_URL) return [];
  const products = await getCatalog();
  return [
    ...PAGES.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...products.map((p) => ({ url: `${SITE_URL}/products/${p.slug}/` })),
  ];
}
