/**
 * 인증 경계면.
 *
 * 화면과 서버 사이를 이 파일 하나로 모은다. 폼·검증·오류 표시는 여기 밖에 있고,
 * 여기가 바뀌어도 화면은 손대지 않는다.
 *
 * ── 정적 내보내기라 더 중요한 것 ────────────────────────
 * 이 사이트는 서버가 상주하지 않는다(output: "export"). 그래서 로그인은
 * **브라우저에서 BE 로 직접** 요청한다. 뒤따르는 제약:
 *
 *   · 토큰을 localStorage 에 두지 않는다. XSS 한 번에 통째로 털린다.
 *     BE 가 HttpOnly + Secure + SameSite 쿠키로 내려주고 브라우저가 알아서 싣게 한다.
 *   · 그래서 fetch 에 credentials: "include" 가 필요하고, BE 는 이 오리진을
 *     CORS 허용 목록에 넣어야 한다 (Vercel 주소와 정식 도메인 둘 다).
 *   · CSRF 토큰을 먼저 받아 헤더에 실어야 한다. 아래 csrfHeader() 가 그 일을 한다.
 *
 * ── 도메인 전제 ─────────────────────────────────────────
 * 화면과 API 가 **같은 상위 도메인** 아래 있어야 한다.
 * 예: 화면 leoneferito.com · API api.leoneferito.com.
 * 서로 다른 사이트면 브라우저가 SameSite=None 을 요구하고, 그건 CSRF 방어를
 * 스스로 낮추는 선택이다. BE 의 SecurityConfig 도 같은 전제 위에 서 있다.
 *
 * ── 화면에 오류를 어떻게 말할 것인가 ────────────────────
 * 로그인 실패를 "이메일이 없습니다" / "비밀번호가 틀립니다" 로 나누지 않는다.
 * 그렇게 답하면 공격자가 **가입된 이메일 목록**을 만들 수 있다(계정 열거).
 * 둘 다 같은 문구로 답한다. 서버도 같은 규칙으로 응답한다.
 */

export interface Credentials {
  email: string;
  password: string;
  /** 로그인 유지. 서버가 쿠키 수명을 다르게 준다 — 브라우저가 판단할 일이 아니다. */
  remember: boolean;
}

export interface SignupInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

/** 로그인한 회원. 서버가 주는 최소 정보만 담는다. */
export interface CurrentUser {
  email: string;
  name: string;
  roles: string[];
}

/** 화면이 구분해서 처리해야 하는 실패만 종류를 나눈다. 나머지는 전부 unknown. */
export type AuthFailure =
  | "invalid-credentials"
  | "locked"
  | "rate-limited"
  | "email-taken"
  | "weak-password"
  | "not-connected"
  | "network"
  | "unknown";

export class AuthError extends Error {
  /**
   * 서버가 준 문구. 비밀번호 규칙처럼 **서버만 아는 이유**를 그대로 보여줘야 할 때 쓴다.
   * 그 외에는 아래 AUTH_MESSAGE 를 쓴다 — 서버 문구를 무조건 띄우면
   * 내부 사정이 화면에 새어 나온다.
   */
  constructor(
    readonly kind: AuthFailure,
    readonly serverMessage?: string,
  ) {
    super(kind);
    this.name = "AuthError";
  }

  /** 화면에 띄울 한 줄. */
  get displayMessage(): string {
    if (this.kind === "weak-password" && this.serverMessage) {
      return this.serverMessage;
    }
    return AUTH_MESSAGE[this.kind];
  }
}

/** 사용자에게 보여줄 문구. 계정 존재 여부가 드러나지 않게 쓴다. */
export const AUTH_MESSAGE: Record<AuthFailure, string> = {
  // 이메일이 없는 경우와 비밀번호가 틀린 경우가 **같은 문구**여야 한다
  "invalid-credentials": "이메일 또는 비밀번호가 올바르지 않습니다.",
  locked: "여러 번 실패해 잠시 잠겼습니다. 잠시 후 다시 시도해 주세요.",
  "rate-limited": "시도가 너무 잦습니다. 잠시 후 다시 시도해 주세요.",
  "email-taken": "이미 가입된 이메일입니다.",
  "weak-password": "비밀번호를 다시 확인해 주세요.",
  "not-connected":
    "로그인 서버가 아직 연결되지 않았습니다. 화면 확인용 단계입니다.",
  network: "연결에 실패했습니다. 네트워크를 확인해 주세요.",
  unknown: "처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

/**
 * API 주소.
 *
 * 비어 있으면 서버가 아직 없다는 뜻이고, 화면은 "연결 안 됨" 으로 동작한다.
 * 정적 내보내기라 이 값은 **빌드 시점에 박힌다** — 주소가 바뀌면 재배포해야 한다.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

/** 서버 연결 여부. 주소가 들어오면 자동으로 켜진다. */
export const AUTH_CONNECTED = API_BASE.length > 0;

/**
 * CSRF 토큰을 받아 헤더 모양으로 돌려준다.
 *
 * 쿠키를 쓰는 인증에는 CSRF 방어가 반드시 따라와야 한다. 쿠키는 브라우저가
 * **알아서** 붙이기 때문에, 다른 사이트가 우리 서버로 보낸 요청에도 실린다.
 * 서버가 내려준 토큰을 헤더로 되돌려 보내면 그게 구분점이 된다 —
 * 다른 사이트는 우리 도메인의 쿠키를 읽을 수 없어서 토큰을 만들지 못한다.
 */
async function csrfHeader(): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE}/api/auth/csrf`, {
    credentials: "include",
  });
  if (!res.ok) throw new AuthError("network");
  const body: { headerName: string; token: string } = await res.json();
  return { [body.headerName]: body.token };
}

/** 서버 오류 응답의 공통 모양. BE 의 ErrorResponse 와 같다. */
interface ErrorBody {
  code?: string;
  message?: string;
}

async function readError(res: Response): Promise<ErrorBody> {
  try {
    return (await res.json()) as ErrorBody;
  } catch {
    // 본문이 비어 있거나 JSON 이 아닐 수 있다. 그때도 흐름이 끊기면 안 된다.
    return {};
  }
}

async function post(path: string, body: unknown): Promise<Response> {
  try {
    return await fetch(`${API_BASE}${path}`, {
      method: "POST",
      credentials: "include", // HttpOnly 쿠키를 주고받기 위해 필수
      headers: {
        "Content-Type": "application/json",
        ...(await csrfHeader()),
      },
      body: JSON.stringify(body),
    });
  } catch {
    // fetch 자체가 실패한 경우 — 네트워크 단절, CORS 거부 등
    throw new AuthError("network");
  }
}

export async function signIn(credentials: Credentials): Promise<CurrentUser> {
  if (!AUTH_CONNECTED) {
    // 화면 확인 단계. 사용자가 누른 것이 헛돌지 않았다는 건 알려야 한다.
    await new Promise((r) => setTimeout(r, 400));
    throw new AuthError("not-connected");
  }

  const res = await post("/api/auth/login", {
    email: credentials.email,
    password: credentials.password,
  });

  if (res.ok) return (await res.json()) as CurrentUser;

  const { code } = await readError(res);
  if (code === "ACCOUNT_LOCKED") throw new AuthError("locked");
  if (res.status === 401) throw new AuthError("invalid-credentials");
  if (res.status === 429) throw new AuthError("rate-limited");
  throw new AuthError("unknown");
}

export async function signUp(input: SignupInput): Promise<void> {
  if (!AUTH_CONNECTED) {
    await new Promise((r) => setTimeout(r, 400));
    throw new AuthError("not-connected");
  }

  const res = await post("/api/auth/signup", input);
  if (res.ok) return;

  const { code, message } = await readError(res);
  if (code === "EMAIL_ALREADY_REGISTERED") throw new AuthError("email-taken");
  /*
   * 비밀번호 규칙만은 서버 문구를 그대로 보여준다. 규칙은 어차피 공개 정보이고,
   * 무엇을 고쳐야 하는지 알려주지 않으면 같은 실패를 반복한다.
   */
  if (code === "WEAK_PASSWORD") throw new AuthError("weak-password", message);
  throw new AuthError("unknown");
}

export async function signOut(): Promise<void> {
  if (!AUTH_CONNECTED) return;
  await post("/api/auth/logout", {});
}

/**
 * 현재 로그인한 회원. 로그인하지 않았으면 null.
 *
 * 401 을 오류로 던지지 않는 이유: "로그인하지 않음" 은 정상 상태다.
 * 헤더가 이 값으로 로그인/로그아웃 표시를 가르는데, 매번 예외를 잡게 하면
 * 호출하는 쪽마다 try 가 생긴다.
 */
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  if (!AUTH_CONNECTED) return null;
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: "include",
    });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    return (await res.json()) as CurrentUser;
  } catch {
    return null;
  }
}

/**
 * 비밀번호 규칙 — 화면용 사본.
 *
 * ⚠️ **서버가 진짜 기준이다.** 여기 있는 건 서버까지 다녀오기 전에 바로 알려주기 위한
 * 것일 뿐, 이걸 통과했다고 가입이 되는 게 아니다. 서버 규칙이 바뀌면 여기도 같이 고친다.
 * (BE: AuthService.validatePassword)
 */
export const PASSWORD_MIN_LENGTH = 10;

/** BCrypt 가 72바이트를 넘는 입력을 잘라내므로 서버가 그 길이에서 거부한다. */
export const PASSWORD_MAX_BYTES = 72;

export function checkPassword(password: string, email: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`;
  }
  // 한글은 UTF-8 로 한 글자가 3바이트다. 글자 수가 아니라 바이트로 센다.
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return "비밀번호가 너무 깁니다. 영문 기준 72자 이내로 입력해 주세요.";
  }
  const localPart = email.split("@")[0]?.trim().toLowerCase();
  if (localPart && password.toLowerCase().includes(localPart)) {
    return "비밀번호에 이메일 주소를 포함할 수 없습니다.";
  }
  return null;
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
