import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * robots.txt — 2026-10-26 검색 노출 허용(오픈 전 전면 차단을 풀었다. 예전 public/robots.txt 는 지웠다).
 *
 * 손님이 검색으로 들어올 공개 페이지만 연다. 로그인 · 주문 · 장바구니 · 마이페이지 · 관리자는 막는다 —
 * 개인 화면이라 검색에 나와도 쓸모가 없고, 각 페이지도 noindex 를 따로 단다.
 * AI 검색 크롤러(GPTBot · ClaudeBot · PerplexityBot 등)도 * 규칙을 따른다 — 공개 페이지는 AI 답변에 인용되게 둔다(GEO).
 * sitemap 주소는 도메인(SITE_URL)이 있을 때만 적는다.
 */
export const dynamic = "force-static";

const PRIVATE = [
  "/admin/",
  "/mypage/",
  "/cart/",
  "/checkout/",
  "/order/",
  "/login/",
  "/signup/",
  "/find/",
  "/find-id/",
  "/reset/",
  "/banner-preview/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: PRIVATE }],
    ...(SITE_URL ? { sitemap: `${SITE_URL}/sitemap.xml` } : {}),
  };
}
