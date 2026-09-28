/**
 * 인증 경계면.
 *
 * 화면은 완성돼 있고 **서버만 아직 없다**(Phase 5). 그 경계를 이 파일 하나로 모은다.
 * 나중에 BE 가 생기면 여기 두 함수의 속만 바꾸면 되고, 폼·검증·오류 표시는 손대지 않는다.
 *
 * ── 정적 내보내기라 더 중요한 것 ────────────────────────
 * 이 사이트는 서버가 상주하지 않는다(output: "export"). 그래서 로그인은
 * **브라우저에서 BE 로 직접** 요청한다. 뒤따르는 제약:
 *
 *   · 토큰을 localStorage 에 두지 않는다. XSS 한 번에 통째로 털린다.
 *     BE 가 HttpOnly + Secure + SameSite 쿠키로 내려주고 브라우저가 알아서 싣게 한다.
 *   · 그래서 fetch 에 credentials: "include" 가 필요하고, BE 는 이 오리진을
 *     CORS 허용 목록에 넣어야 한다 (Vercel 주소와 정식 도메인 둘 다).
 *   · CSRF 방어가 같이 있어야 한다. SameSite=Lax 만으로는 부족한 경로가 있다.
 *
 * ── 화면에 오류를 어떻게 말할 것인가 ────────────────────
 * "이메일이 없습니다" / "비밀번호가 틀립니다" 로 나누지 않는다. 그렇게 답하면
 * 공격자가 **가입된 이메일 목록**을 만들 수 있다(계정 열거). 둘 다 같은 문구로 답한다.
 */

export interface Credentials {
  email: string;
  password: string;
  /** 로그인 유지. 서버가 쿠키 수명을 다르게 준다 — 브라우저가 판단할 일이 아니다. */
  remember: boolean;
}

/** 화면이 구분해서 처리해야 하는 실패만 종류를 나눈다. 나머지는 전부 unknown. */
export type AuthFailure =
  | "invalid-credentials"
  | "locked"
  | "rate-limited"
  | "not-connected"
  | "network"
  | "unknown";

export class AuthError extends Error {
  constructor(readonly kind: AuthFailure) {
    super(kind);
    this.name = "AuthError";
  }
}

/** 사용자에게 보여줄 문구. 계정 존재 여부가 드러나지 않게 쓴다. */
export const AUTH_MESSAGE: Record<AuthFailure, string> = {
  // 이메일이 없는 경우와 비밀번호가 틀린 경우가 **같은 문구**여야 한다
  "invalid-credentials": "이메일 또는 비밀번호가 올바르지 않습니다.",
  locked: "여러 번 실패해 잠시 잠겼습니다. 잠시 후 다시 시도해 주세요.",
  "rate-limited": "시도가 너무 잦습니다. 잠시 후 다시 시도해 주세요.",
  "not-connected":
    "로그인 서버가 아직 연결되지 않았습니다. 화면 확인용 단계입니다.",
  network: "연결에 실패했습니다. 네트워크를 확인해 주세요.",
  unknown: "로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

/**
 * 서버 연결 여부. 지금은 항상 false 다.
 *
 * 환경변수로 두지 않는 이유: 정적 내보내기는 빌드 시점에 값이 박힌다. 껐다 켜려면
 * 어차피 재배포이므로, 코드에 한 줄로 두는 편이 "지금 어느 단계인가" 가 더 잘 보인다.
 */
export const AUTH_CONNECTED = false;

// credentials 는 아직 쓰지 않는다. Phase 5 에서 이 함수 안에서 쓰므로 이름을 지우지 않는다.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function signIn(credentials: Credentials): Promise<void> {
  if (!AUTH_CONNECTED) {
    // 화면 확인 단계. 사용자가 누른 것이 헛돌지 않았다는 건 알려야 한다.
    await new Promise((r) => setTimeout(r, 400));
    throw new AuthError("not-connected");
  }

  // Phase 5 에서 채운다.
  //
  //   const res = await fetch(`${API_BASE}/api/auth/login`, {
  //     method: "POST",
  //     credentials: "include",          // HttpOnly 쿠키를 받기 위해 필수
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(credentials),
  //   });
  //   if (res.status === 401) throw new AuthError("invalid-credentials");
  //   if (res.status === 423) throw new AuthError("locked");
  //   if (res.status === 429) throw new AuthError("rate-limited");
  //   if (!res.ok) throw new AuthError("unknown");
  throw new AuthError("unknown");
}

/**
 * 간편 로그인.
 *
 * TODO(고객확인) C-2 — 카카오·네이버 앱 등록은 **고객사 명의**로 해야 한다.
 * 개발사 계정으로 만들어두면 나중에 소유권을 넘기기 어렵다.
 *
 * ⚠️ 붙일 때 규칙: 같은 이메일이라는 이유로 기존 계정에 **자동 병합하지 않는다.**
 * 소셜 쪽 이메일은 검증됐다는 보장이 없어서, 남의 계정을 가져가는 경로가 된다.
 * 반드시 기존 계정 비밀번호로 한 번 더 확인시킨 뒤 연결한다.
 */
export const SOCIAL_PROVIDERS = [
  { id: "kakao", label: "카카오로 계속하기" },
  { id: "naver", label: "네이버로 계속하기" },
] as const;
