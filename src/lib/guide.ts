/**
 * 가이드 페이지 "제품별 제작 소요기간" 표 — **빌드할 때** 서버에서 받는다 (lib/business.ts 와 같은 규칙, 서버 V42).
 *
 * 관리자 › 가이드 · 제작 기간에서 고치면 서버가 손님 화면을 다시 만든다(FrontRebuildTrigger).
 * API 주소가 없으면(화면 확인 단계) 아래 기본 표, 주소가 있는데 응답하지 않으면 빌드를 실패시킨다 —
 * 조용히 옛 값으로 대신하면 관리자가 고친 제작 기간이 운영에서 사라진 채 배포된다.
 *
 * 이 파일은 서버 컴포넌트(빌드)에서만 쓴다.
 */

export interface GuideLeadTime {
  /** 품목 — "자켓 / 팬츠 / 베스트" */
  items: string;
  /** 기간 — "14~18일", "바로 출고" */
  time: string;
}

/** 서버 V42 가 처음 심은 값과 같다(2026-10-28 디자이너 시안) */
export const DEFAULT_LEAD_TIMES: GuideLeadTime[] = [
  { items: "자켓 / 팬츠 / 베스트", time: "14~18일" },
  { items: "셔츠 / 구두 / 로퍼", time: "7~10일" },
  { items: "넥타이", time: "바로 출고" },
];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
// 빌드 때 받아 오는 주소 — lib/why.ts 주석 참고
const FETCH_BASE = process.env.API_BUILD_BASE || API_BASE;

async function load(): Promise<GuideLeadTime[]> {
  const res = await fetch(`${FETCH_BASE}/api/site-guide`);
  if (!res.ok) {
    throw new Error(`가이드 제작 기간 API 응답 실패: ${res.status}`);
  }
  const d = (await res.json()) as { leadTimes: GuideLeadTime[] };
  return d.leadTimes.map((r) => ({ items: r.items, time: r.time }));
}

let memo: Promise<GuideLeadTime[]> | null = null;

export function getGuideLeadTimes(): Promise<GuideLeadTime[]> {
  if (!API_BASE) return Promise.resolve(DEFAULT_LEAD_TIMES);
  if (process.env.NODE_ENV !== "production") return load();
  memo ??= load();
  return memo;
}
