import { WHY_FALLBACK } from "@/data/why";

/**
 * 메인 WHY 구간 — **빌드할 때** 서버에서 받는다 (lib/catalog.ts 와 같은 규칙).
 *
 * 관리자가 고치면 서버가 손님 화면을 다시 만든다(FrontRebuildTrigger). API 주소가 없으면 기본 문구,
 * 주소가 있는데 응답하지 않으면 빌드를 실패시킨다 — 조용히 기본 문구로 대신하면 관리자가 고친 것이
 * 운영에서 사라진 채 배포된다.
 *
 * 이 파일은 서버 컴포넌트(빌드)에서만 쓴다.
 */

export interface WhyItem {
  title: string;
  body: string;
  /** 배경 사진. null 이면 코드의 기본 배경(public/brand/tailoring.webp)을 쓴다. */
  imageUrl: string | null;
}

export interface WhyContent {
  eyebrow: string;
  title: string;
  intro: string;
  items: WhyItem[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
// 빌드 때 받아 오는 주소. 서버의 빌더(BE deploy/front-builder)는 API_BUILD_BASE 로 내부 주소(http://api:8080)를 준다 —
// 바깥 도메인을 돌지 않고, DNS · 인증서가 준비되기 전에도 빌드된다. 없으면 브라우저와 같은 주소를 쓴다.
// NEXT_PUBLIC_ 이 아니라서 결과물에 박히지 않는다.
const FETCH_BASE = process.env.API_BUILD_BASE || API_BASE;

async function load(): Promise<WhyContent> {
  const res = await fetch(`${FETCH_BASE}/api/why`);
  if (!res.ok) {
    throw new Error(`WHY API 응답 실패: ${res.status}`);
  }
  const d = (await res.json()) as WhyContent;
  return {
    eyebrow: d.eyebrow,
    title: d.title,
    intro: d.intro,
    items: d.items.map((i) => ({ title: i.title, body: i.body, imageUrl: i.imageUrl ?? null })),
  };
}

let memo: Promise<WhyContent> | null = null;

export function getWhy(): Promise<WhyContent> {
  if (!API_BASE) return Promise.resolve(WHY_FALLBACK);
  if (process.env.NODE_ENV !== "production") return load();
  memo ??= load();
  return memo;
}
