"use client";

import { CheckCircle, Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Field } from "@/components/ui/Field";
import { AuthError, confirmPasswordReset, PASSWORD_MIN_LENGTH } from "@/lib/auth";

/**
 * 새 비밀번호 정하기 — 메일 속 링크로 들어온다.
 *
 * ── 토큰은 주소의 # 뒤에 있다 ───────────────────────────
 * `#` 뒤(fragment)는 서버로 가지 않는다. 호스팅 로그에도, 다른 사이트로 가는 Referer 에도
 * 실리지 않는다. 읽자마자 주소창에서도 지운다 — 화면 공유나 어깨 너머로 보이지 않게.
 * 그래서 새로고침하면 토큰이 사라진다. 그때는 메일 링크를 다시 누르면 된다(30분 안이면 유효).
 *
 * ── 이메일을 모른다 ─────────────────────────────────────
 * 링크에는 토큰만 있다. 그래서 "비밀번호에 이메일 포함 금지" 는 여기서 미리 못 본다 —
 * 서버가 보고 문구를 돌려주면 그대로 보여준다.
 */
export function PasswordResetForm() {
  // undefined = 아직 주소를 안 읽음(정적 HTML 단계), null = 토큰 없음
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const found = new URLSearchParams(window.location.hash.slice(1)).get("token");
    if (found) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    /*
     * 브라우저 주소는 외부 시스템이다 — 마운트 때 읽어 상태로 옮긴다.
     * 이미 읽은 토큰은 지우지 않는다: 개발 모드(StrictMode)는 이 effect 를 두 번 돌리는데,
     * 첫 번째가 주소에서 토큰을 지웠으므로 두 번째는 빈 값을 읽는다. 그걸로 덮으면
     * 멀쩡한 링크가 "올바르지 않습니다" 가 된다 (실제로 그랬다).
     */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken((prev) => found ?? prev ?? null);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const found: typeof errors = {};
    if (password.length < PASSWORD_MIN_LENGTH) {
      found.password = `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`;
    }
    if (password !== confirm) found.confirm = "비밀번호가 서로 다릅니다.";
    setErrors(found);
    setServerError(null);
    if (Object.keys(found).length > 0) return;

    setPending(true);
    try {
      await confirmPasswordReset(token, password);
      setDone(true);
    } catch (err) {
      if (err instanceof AuthError && err.kind === "weak-password") {
        setErrors({ password: err.displayMessage });
      } else {
        setServerError(err instanceof AuthError ? err.displayMessage : "처리하지 못했습니다.");
      }
    } finally {
      setPending(false);
    }
  }

  if (token === undefined) {
    return (
      <p aria-busy="true" className="text-muted text-sm">
        확인하는 중
      </p>
    );
  }

  if (done) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <p className="text-success flex items-center gap-2 text-sm">
          <CheckCircle size={18} weight="light" aria-hidden="true" />
          비밀번호를 바꿨습니다
        </p>
        <p className="text-secondary text-sm leading-relaxed">
          보안을 위해 모든 기기에서 로그아웃했습니다. 새 비밀번호로 로그인해 주세요.
        </p>
        <Link
          href="/login"
          className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid flex min-h-14 items-center justify-center rounded-full text-sm transition-colors duration-300"
        >
          로그인
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-secondary text-sm leading-relaxed">
          링크가 올바르지 않습니다. 메일 속 링크를 다시 눌러 주세요. 30분이 지났다면 새 링크를
          받아야 합니다.
        </p>
        <Link
          href="/find"
          className="text-accent hover:text-accent-hover inline-flex min-h-11 items-center text-sm underline underline-offset-4"
        >
          비밀번호 찾기
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <Field
        label="새 비밀번호"
        name="new-password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        hint={`${PASSWORD_MIN_LENGTH}자 이상. 이메일 주소는 포함할 수 없습니다.`}
      />
      <Field
        label="새 비밀번호 확인"
        name="new-password-confirm"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm}
      />

      {serverError && (
        <div role="alert" className="flex flex-col gap-2">
          <p className="text-error text-2xs flex gap-1.5 leading-relaxed">
            <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
            <span>{serverError}</span>
          </p>
          <Link href="/find" className="text-accent text-2xs pl-5 underline underline-offset-4">
            새 링크 받기
          </Link>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid flex min-h-14 items-center justify-center rounded-full text-sm transition-colors duration-300 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "저장 중" : "비밀번호 저장"}
      </button>
    </form>
  );
}
