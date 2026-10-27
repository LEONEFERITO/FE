/**
 * 제작 기간 — 한 값("18일") 또는 범위("14~18일", 2026-10-27 대표님 요청, 서버 V40).
 * 서버의 leadTimeDays 가 최대, leadTimeMinDays 가 최소다. 발송 예정 · 주문 안내 계산은 늘 최대로 한다 — 늦게 약속하지 않게.
 */

/** 화면 글자 — 최소가 있고 최대보다 작으면 "14~18일", 아니면 "18일" */
export function leadTimeText(max: number, min?: number | null): string {
  return min != null && min < max ? `${min}~${max}일` : `${max}일`;
}

/**
 * 관리자 입력 "14" · "14~18" · "14-18" → { min, max }. 비었으면 null, 틀리면 "invalid".
 * 같은 두 값("14~14")은 한 값으로 본다.
 */
export function parseLeadTime(input: string): { min: number | null; max: number } | null | "invalid" {
  const t = input.replace(/[\s일]/g, "");
  if (!t) return null;
  const m = /^(\d{1,3})(?:[~\-–](\d{1,3}))?$/.exec(t);
  if (!m) return "invalid";
  const a = Number(m[1]);
  const b = m[2] === undefined ? a : Number(m[2]);
  if (a < 1 || b > 365 || a > b) return "invalid";
  return { min: a === b ? null : a, max: b };
}
