"use client";

import { MagnifyingGlass, Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState } from "react";

import { Field } from "@/components/ui/Field";
import { AuthError, findEmail, type FoundAccount } from "@/lib/auth";

/**
 * 아이디 찾기 — 로그인 아이디는 이메일이다. 이름과 휴대폰 번호가 같은 계정의 이메일을 가려서 보여 준다(서버가 가린다).
 * 찾은 뒤에는 로그인 · 비밀번호 찾기로 이어 준다. 간편가입 계정이면 그 버튼으로 로그인하라고 알려 준다.
 * 못 찾으면 이유가 될 만한 것(번호를 안 넣고 가입 · 간편가입)을 적는다.
 */
const PROVIDER_LABEL: Record<FoundAccount["providers"][number], string> = {
  LOCAL: "이메일",
  KAKAO: "카카오",
  NAVER: "네이버",
};

export function FindEmailForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [found, setFound] = useState<FoundAccount[] | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const digits = phone.replace(/[^0-9]/g, "");
    const next = {
      name: name.trim() ? undefined : "이름을 적어 주세요.",
      phone: digits.length >= 10 && digits.length <= 11 ? undefined : "휴대폰 번호를 확인해 주세요.",
    };
    setErrors(next);
    if (next.name || next.phone) return;
    setPending(true);
    try {
      setFound(await findEmail(name.trim(), digits));
    } catch (err) {
      setServerError(err instanceof AuthError ? err.displayMessage : "처리하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  if (found) {
    return (
      <div role="status" className="flex flex-col gap-5">
        {found.length === 0 ? (
          <>
            <p className="text-primary text-sm">일치하는 계정을 찾지 못했습니다.</p>
            <ul className="text-muted text-2xs flex list-disc flex-col gap-1 pl-5 leading-relaxed">
              <li>가입할 때 적은 이름과 휴대폰 번호인지 확인해 주세요.</li>
              <li>휴대폰 번호 없이 가입하셨다면 이 방법으로는 찾을 수 없습니다.</li>
              <li>카카오·네이버로 가입하셨다면 그 버튼으로 바로 로그인해 주세요.</li>
            </ul>
          </>
        ) : (
          <>
            <p className="text-secondary text-sm">이 이름과 번호로 가입된 계정입니다.</p>
            <ul className="border-subtle divide-subtle divide-y border-y">
              {found.map((a) => (
                <li key={a.maskedEmail + a.joinedOn} className="flex flex-col gap-1.5 py-4">
                  <span className="text-primary text-base break-all tabular-nums">{a.maskedEmail}</span>
                  <span className="text-muted text-2xs">
                    {a.providers.map((p) => PROVIDER_LABEL[p]).join(" · ")}로 로그인 · {a.joinedOn.replaceAll("-", ".")} 가입
                  </span>
                </li>
              ))}
            </ul>
            {found.some((a) => !a.providers.includes("LOCAL")) && (
              <p className="text-muted text-2xs leading-relaxed">
                카카오·네이버로만 가입한 계정은 비밀번호가 없습니다. 로그인 화면의 그 버튼으로 들어와 주세요.
              </p>
            )}
          </>
        )}

        <div className="flex flex-wrap gap-5">
          <Link
            href="/login"
            className="text-accent hover:text-accent-hover inline-flex min-h-11 items-center text-xs underline underline-offset-4"
          >
            로그인하러 가기
          </Link>
          <Link
            href="/find"
            className="text-muted hover:text-accent inline-flex min-h-11 items-center text-xs underline underline-offset-4"
          >
            비밀번호 찾기
          </Link>
          <button
            type="button"
            onClick={() => setFound(null)}
            className="text-muted hover:text-accent min-h-11 text-xs underline underline-offset-4"
          >
            다시 찾기
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <Field
        label="이름"
        name="name"
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="홍길동"
      />
      <Field
        label="휴대폰 번호"
        name="phone"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={errors.phone}
        placeholder="010-1234-5678"
        hint="가입할 때(또는 마이페이지에서) 적은 번호입니다."
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
        className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid flex min-h-14 items-center justify-center gap-2 rounded-full text-sm transition-colors duration-300 disabled:cursor-wait disabled:opacity-60"
      >
        <MagnifyingGlass size={16} weight="light" aria-hidden="true" />
        {pending ? "찾는 중" : "아이디 찾기"}
      </button>

      <div className="flex justify-center gap-5">
        <Link href="/login" className="text-muted hover:text-accent inline-flex min-h-11 items-center text-xs underline underline-offset-4">
          로그인으로 돌아가기
        </Link>
        <Link href="/find" className="text-muted hover:text-accent inline-flex min-h-11 items-center text-xs underline underline-offset-4">
          비밀번호 찾기
        </Link>
      </div>
    </form>
  );
}
