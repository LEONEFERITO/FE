/**
 * 아직 확정되지 않은 값의 **화면 표기**.
 *
 * 코드 안에서는 `TODO(고객확인)` 으로 표시하고 문서(CLIENT_QUESTIONS.md)로 추적하지만,
 * 그 문자열이 화면에 그대로 나가면 안 된다. 고객·대표가 보는 화면에 개발 표기가 찍히면
 * "미완성" 이 아니라 "허술함" 으로 읽힌다.
 *
 * 그렇다고 빈칸으로 두지도 않는다. 비어 있다는 사실이 보여야 잊히지 않는다 —
 * 화면에는 사람 말로, 코드에는 추적 가능한 표기로. 그 두 개를 여기서 잇는다.
 */
export const PENDING = "확인 중";

/** 예: pendingLabel("측정 기준") → "측정 기준 확인 중" */
export function pendingLabel(what?: string): string {
  return what ? `${what} ${PENDING}` : PENDING;
}

/** 예: pendingHint("측정 기준", "평평히 놓고 잰 단면 기준") → "측정 기준 확인 중 · 예) 평평히 …" */
export function pendingHint(what: string, example?: string): string {
  return example
    ? `${pendingLabel(what)} · 예) ${example}`
    : pendingLabel(what);
}
