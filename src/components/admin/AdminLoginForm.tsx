"use client";

import { Warning } from "@phosphor-icons/react/dist/ssr";
import { useState, useSyncExternalStore } from "react";

import { Field } from "@/components/ui/Field";
import { AuthError, adminSignIn, safeNext } from "@/lib/auth";

/**
 * 관리자 로그인 (/admin/login). 아이디 또는 이메일.
 *
 * 실패 문구는 하나다 — "아이디 또는 비밀번호". 관리자가 아닌 계정도 같은 답이다(서버가 그렇게 준다).
 * 성공하면 임시 비밀번호는 변경 화면으로, 아니면 원래 가려던 관리자 화면(없으면 대시보드)으로.
 * 다른 곳으로는 보내지 않는다 — next 는 /admin 안쪽만 받는다.
 */
export function AdminLoginForm() {
  const next = useSyncExternalStore<string>(
    () => () => {},
    () => {
      const raw = safeNext(new URLSearchParams(window.location.search).get("next"));
      return raw.startsWith("/admin") && !raw.startsWith("/admin/login") ? raw : "/admin/";
    },
    () => "/admin/",
  );
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!loginId.trim() || !password) {
      setError("아이디와 비밀번호를 넣어 주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const user = await adminSignIn(loginId.trim(), password);
      window.location.href = user.mustChangePassword ? `/admin/password/?next=${encodeURIComponent(next)}` : next;
    } catch (err) {
      const kind = err instanceof AuthError ? err.kind : "unknown";
      setError(
        kind === "invalid-credentials"
          ? "아이디 또는 비밀번호가 올바르지 않습니다."
          : err instanceof AuthError
            ? err.displayMessage
            : "로그인하지 못했습니다.",
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Field label="아이디 또는 이메일" name="loginId" autoComplete="username" value={loginId}
        onChange={(e) => setLoginId(e.target.value)} autoCapitalize="none" spellCheck={false} />
      <Field label="비밀번호" name="password" type="password" autoComplete="current-password" value={password}
        onChange={(e) => setPassword(e.target.value)} />
      {error && (
        <p role="alert" className="text-error text-2xs flex gap-1.5 leading-relaxed">
          <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
          <span>{error}</span>
        </p>
      )}
      <button type="submit" disabled={busy}
        className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid flex min-h-13 items-center justify-center rounded-full text-sm transition-colors duration-300 disabled:cursor-wait disabled:opacity-60">
        {busy ? "확인하는 중" : "관리자 로그인"}
      </button>
    </form>
  );
}
