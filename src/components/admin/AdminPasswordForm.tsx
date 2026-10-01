"use client";

import { Warning } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Field } from "@/components/ui/Field";
import {
  AUTH_CONNECTED,
  AuthError,
  PASSWORD_MIN_LENGTH,
  changePassword,
  checkPassword,
  fetchCurrentUser,
  safeNext,
  type CurrentUser,
} from "@/lib/auth";

/**
 * 관리자 비밀번호 바꾸기 (/admin/password). 임시 비밀번호 계정은 바꾸기 전에 서버가 관리자 API 를 막는다.
 * 규칙은 가입과 같다(서버 PasswordPolicy) — 화면 검사는 미리 알려 주는 용도다.
 */
export function AdminPasswordForm() {
  const next = useSyncExternalStore<string>(
    () => () => {},
    () => {
      const raw = safeNext(new URLSearchParams(window.location.search).get("next"));
      return raw.startsWith("/admin") && !raw.startsWith("/admin/password") ? raw : "/admin/";
    },
    () => "/admin/",
  );
  const [user, setUser] = useState<CurrentUser | null | undefined>(AUTH_CONNECTED ? undefined : null);
  const [current, setCurrent] = useState("");
  const [fresh, setFresh] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!AUTH_CONNECTED) return;
    fetchCurrentUser().then((u) => {
      if (!u) window.location.replace(`/admin/login/?next=${encodeURIComponent("/admin/password/")}`);
      else setUser(u);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) return;
    const problem = checkPassword(fresh, user.email);
    if (problem) return setError(problem);
    if (fresh !== again) return setError("새 비밀번호가 서로 다릅니다.");
    if (fresh === current) return setError("지금 비밀번호와 다른 비밀번호로 바꿔 주세요.");
    setBusy(true);
    try {
      await changePassword(current, fresh);
      window.location.href = next;
    } catch (err) {
      setError(err instanceof AuthError ? err.displayMessage : "바꾸지 못했습니다.");
      setBusy(false);
    }
  }

  if (user === undefined) {
    return (
      <p aria-busy="true" className="text-muted text-sm">
        확인하는 중
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {user?.mustChangePassword && (
        <p className="border-subtle bg-band/60 rounded-xl border px-4 py-3 text-sm leading-relaxed">
          임시 비밀번호로 로그인했습니다. 새 비밀번호를 정해야 관리자 화면이 열립니다.
        </p>
      )}
      <Field label="지금 비밀번호" name="current" type="password" autoComplete="current-password" value={current}
        onChange={(e) => setCurrent(e.target.value)} />
      <Field label="새 비밀번호" name="new" type="password" autoComplete="new-password" value={fresh}
        onChange={(e) => setFresh(e.target.value)} hint={`${PASSWORD_MIN_LENGTH}자 이상`} />
      <Field label="새 비밀번호 한 번 더" name="again" type="password" autoComplete="new-password" value={again}
        onChange={(e) => setAgain(e.target.value)} />
      {error && (
        <p role="alert" className="text-error text-2xs flex gap-1.5 leading-relaxed">
          <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
          <span>{error}</span>
        </p>
      )}
      <button type="submit" disabled={busy || !user}
        className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid flex min-h-13 items-center justify-center rounded-full text-sm transition-colors duration-300 disabled:cursor-wait disabled:opacity-60">
        {busy ? "바꾸는 중" : "비밀번호 바꾸기"}
      </button>
    </form>
  );
}
