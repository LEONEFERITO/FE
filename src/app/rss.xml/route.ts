import { getCatalog } from "@/lib/catalog";
import { BRAND_DESCRIPTION } from "@/lib/metadata";
import { SITE_URL } from "@/lib/site";
import { CATEGORY_LABEL } from "@/types/product";

/**
 * rss.xml — 2026-11-19 네이버 서치어드바이저 제출용(요청 › RSS 제출).
 *
 * 네이버는 사이트맵과 별도로 RSS 를 받아 새 글 · 새 상품을 더 빨리 수집한다. 구글은 사이트맵으로 충분하다.
 * 판매 중인 상품을 한 항목씩 적는다 — 제목 · 주소 · 한 줄 소개 · 분류. 정적 빌드 때 만든다(out/rss.xml).
 * 도메인(SITE_URL)이 없으면 빈 채널이다.
 */
export const dynamic = "force-static";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export async function GET() {
  const base = SITE_URL ?? "";
  const products = SITE_URL ? await getCatalog() : [];
  const items = products
    .filter((p) => p.name)
    .map((p) => {
      const url = `${base}/products/${p.slug}/`;
      const category = CATEGORY_LABEL[p.category].ko;
      const description = p.summary?.trim() || `${p.name} — 레오네페리토 ${category}`;
      return [
        "<item>",
        `<title>${esc(p.name!)}</title>`,
        `<link>${esc(url)}</link>`,
        `<guid isPermaLink="true">${esc(url)}</guid>`,
        `<description>${esc(description)}</description>`,
        `<category>${esc(category)}</category>`,
        "</item>",
      ].join("");
    });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "<channel>",
    "<title>LEONE FERITO 레오네페리토</title>",
    `<link>${esc(`${base}/`)}</link>`,
    `<description>${esc(BRAND_DESCRIPTION)}</description>`,
    "<language>ko</language>",
    ...items,
    "</channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
