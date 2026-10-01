"use client";

import { EnvelopeSimple, Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState } from "react";

import { Field } from "@/components/ui/Field";
import { AuthError, requestPasswordReset } from "@/lib/auth";

/**
 * 비밀번호 찾기 — 재설정 메일 요청.
 *
 * ── 결과는 한 가지로만 말한다 ───────────────────────────
 * 가입된 이메일이든 아니든 "메일을 보냈습니다" 다. "가입되지 않은 이메일입니다" 라고 하면
 * 이 화면이 가입 여부 조회기가 된다. 대신 **메일이 안 오면 어떻게 하는지**를 함께 적는다 —
 * 오타였을 수도, 간편가입 계정일 수도 있다(간편가입 계정에는 로그인 방법 안내 메일이 간다).
 */
export function PasswordResetRequestForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+$/.test(value)) {
      setError("이메일 주소를 확인해 주세요.");
      return;
    }
    setError(undefined);
    setPending(true);
    try {
      await requestPasswordReset(value);
      setSentTo(value);
    } catch (err) {
      setServerError(err instanceof AuthError ? err.displayMessage : "처리하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <p className="text-primary flex items-center gap-2 text-sm">
          <EnvelopeSimple size={18} weight="light" aria-hidden="true" className="text-accent" />
          메일을 보냈습니다
        </p>
        <p className="text-secondary text-sm leading-relaxed">
          <b className="text-primary break-all">{sentTo}</b> 로 가입된 계정이 있으면 비밀번호 재설정
          링크가 도착합니다. 링크는 30분 동안 한 번만 쓸 수 있습니다.
        </p>
        <ul className="text-muted text-2xs flex list-disc flex-col gap-1 pl-5 leading-relaxed">
          <li>몇 분이 지나도 안 오면 스팸함을 확인해 주세요.</li>
          <li>카카오·네이버로 가입하셨다면 로그인 방법을 안내하는 메일이 갑니다.</li>
          <li>그래도 없다면 이메일 주소에 오타가 없는지 확인하고 다시 요청해 주세요.</li>
        </ul>
        <div className="flex flex-wrap gap-5">
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="text-muted hover:text-accent min-h-11 text-xs underline underline-offset-4"
          >
            다른 이메일로 다시 요청
          </button>
          <Link
            href="/login"
            className="text-accent hover:text-accent-hover inline-flex min-h-11 items-center text-xs underline underline-offset-4"
          >
            로그인으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <Field
        label="가입한 이메일"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
        placeholder="name@example.com"
      />

      {serverError && (
        <p role="alert" className="text-error text-2xs flex gap-1.5 leading-relaxed">
          <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
          <span>{serverError}</span>
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid flex min-h-14 items-center justify-center rounded-full text-sm transition-colors duration-300 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "보내는 중" : "재설정 링크 받기"}
      </button>

      <Link
        href="/login"
        className="text-muted hover:text-accent self-center inline-flex min-h-11 items-center text-xs underline underline-offset-4"
      >
        로그인으로 돌아가기
      </Link>
    </form>
  );
}
