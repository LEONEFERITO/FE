"use client";

import {
  ArrowRight,
  Eye,
  EyeSlash,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRef, useState } from "react";

import { Field } from "@/components/ui/Field";
import {
  AuthError,
  PASSWORD_MIN_LENGTH,
  checkPassword,
  signUp,
} from "@/lib/auth";

/**
 * 회원가입 폼.
 *
 * 로그인 폼과 같은 규칙을 따른다 — 제출 전에는 오류를 띄우지 않고, 실패는 칸 아래와
 * 폼 상단 요약 두 곳에 말하고, 요약으로 초점을 옮긴다. 두 화면의 규칙이 다르면
 * 사용자는 같은 사이트에서 두 번 배워야 한다.
 *
 * ── 비밀번호 확인 칸을 두는 이유 ────────────────────────
 * 가입은 **처음이자 한 번뿐인 입력**이라 오타를 확인할 기회가 없다. 틀리면 바로
 * 비밀번호 찾기로 넘어가야 하는데, 그 경로가 아직 없다.
 * (로그인 화면에는 확인 칸이 없다 — 거기서는 틀리면 다시 치면 된다)
 *
 * ── 비밀번호 규칙을 미리 보여준다 ───────────────────────
 * 제출한 뒤에야 "10자 이상" 을 알려주면 한 번 헛걸음한다. 칸 아래 안내로 먼저 말한다.
 * 다만 **서버가 진짜 기준이다.** 여기 검사는 서버까지 다녀오기 전에 알려주기 위한 것이고,
 * 서버가 거부하면 그쪽 문구를 그대로 보여준다.
 *
 * ── 이용약관 ────────────────────────────────────────────
 * TODO(고객확인) 약관·개인정보처리방침 문안이 아직 없다. 링크만 자리를 잡아두고
 * 동의 체크는 **필수**로 둔다. 문안 없이 동의를 받으면 동의 자체가 무효다.
 */

interface Errors {
  email?: string;
  password?: string;
  confirm?: string;
  name?: string;
  phone?: string;
  agree?: string;
}

function validate(v: {
  email: string;
  password: string;
  confirm: string;
  name: string;
  phone: string;
  agree: boolean;
}): Errors {
  const errors: Errors = {};

  if (!v.name.trim()) {
    errors.name = "이름을 입력해 주세요.";
  }

  if (!v.email.trim()) {
    errors.email = "이메일을 입력해 주세요.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) {
    // 형식 검사는 느슨하게 둔다. RFC 를 엄격히 따르면 실제로 쓰이는 주소를 막는다.
    errors.email = "이메일 형식이 올바르지 않습니다.";
  }

  if (!v.password) {
    errors.password = "비밀번호를 입력해 주세요.";
  } else {
    const problem = checkPassword(v.password, v.email.trim());
    if (problem) errors.password = problem;
  }

  if (!v.confirm) {
    errors.confirm = "비밀번호를 한 번 더 입력해 주세요.";
  } else if (v.password && v.confirm !== v.password) {
    errors.confirm = "비밀번호가 서로 다릅니다.";
  }

  // 전화번호는 선택이다. 입력했을 때만 형식을 본다.
  if (v.phone.trim() && !/^[0-9-]{9,20}$/.test(v.phone.trim())) {
    errors.phone = "숫자와 하이픈만 입력해 주세요.";
  }

  if (!v.agree) {
    errors.agree = "약관에 동의해 주세요.";
  }

  return errors;
}

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const summaryRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  const values = { email, password, confirm, name, phone, agree };
  const errors = submitted ? validate(values) : {};
  const hasFieldError = Object.keys(errors).length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);

    const found = validate(values);
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setPending(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
      setDone(true);
      // 성공도 초점을 옮겨 알린다. 화면이 바뀐 걸 눈으로만 알리면 안 된다.
      requestAnimationFrame(() => doneRef.current?.focus());
    } catch (err) {
      setFormError(
        err instanceof AuthError
          ? err.displayMessage
          : "가입하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
      requestAnimationFrame(() => summaryRef.current?.focus());
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div
        ref={doneRef}
        tabIndex={-1}
        role="status"
        className="border-subtle bg-band/60 rounded-2xl border px-6 py-8 text-center"
      >
        <p className="font-display text-primary text-xl">가입이 완료되었습니다</p>
        <p className="text-secondary mt-3 text-sm leading-relaxed">
          이제 로그인하실 수 있습니다.
        </p>
        <Link
          href="/login"
          className="group bg-accent text-on-accent hover:bg-accent-hover shadow-button ease-fluid mt-7 inline-flex min-h-12 items-center gap-3 rounded-full px-7 text-sm transition-all duration-500 hover:-translate-y-px"
        >
          로그인하러 가기
          <ArrowRight size={14} weight="light" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const summary =
    formError ?? (hasFieldError ? "입력한 내용을 확인해 주세요." : null);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div
        ref={summaryRef}
        tabIndex={-1}
        role="alert"
        aria-live="assertive"
        className={
          summary
            ? "border-error/40 bg-velvet-tint/60 rounded-xl border px-5 py-4"
            : ""
        }
      >
        {summary && (
          <p className="text-error text-2xs flex gap-2 leading-relaxed">
            <Warning
              size={14}
              weight="light"
              aria-hidden="true"
              className="mt-px shrink-0"
            />
            <span>{summary}</span>
          </p>
        )}
      </div>

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
        label="이메일"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        hint="주문 안내와 비밀번호 재설정에 사용됩니다."
        placeholder="name@example.com"
      />

      <Field
        label="비밀번호"
        type={visible ? "text" : "password"}
        name="password"
        // new-password 라고 알려주면 비밀번호 관리자가 강한 값을 제안한다.
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        hint={`${PASSWORD_MIN_LENGTH}자 이상. 길수록 안전합니다 — 기억하기 쉬운 문장을 권합니다.`}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            aria-label={visible ? "비밀번호 가리기" : "비밀번호 보기"}
            className="text-muted hover:text-accent ease-fluid flex h-11 w-11 items-center justify-center rounded-lg transition-colors duration-300"
          >
            {visible ? (
              <EyeSlash size={18} weight="light" aria-hidden="true" />
            ) : (
              <Eye size={18} weight="light" aria-hidden="true" />
            )}
          </button>
        }
      />

      <Field
        label="비밀번호 확인"
        type={visible ? "text" : "password"}
        name="password-confirm"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm}
      />

      <Field
        label="휴대폰 번호 (선택)"
        type="tel"
        name="phone"
        autoComplete="tel"
        inputMode="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={errors.phone}
        hint="주문·배송 안내에 사용됩니다."
        placeholder="010-1234-5678"
      />

      {/*
        약관 동의. 체크박스와 오류를 손으로 묶는다 — Field 는 input 한 칸을 위한 것이라
        여기에 맞지 않는다. aria-describedby·aria-invalid 는 같은 규칙으로 맞춘다.
      */}
      <div className="flex flex-col gap-2">
        <label className="text-secondary text-2xs flex min-h-11 cursor-pointer items-start gap-2.5 leading-relaxed">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            aria-invalid={errors.agree ? true : undefined}
            aria-describedby={errors.agree ? "agree-error" : undefined}
            className="accent-accent mt-0.5 h-4 w-4 shrink-0"
          />
          <span>
            {/* TODO(고객확인) 약관·개인정보처리방침 문안 필요 */}
            <Link
              href="/terms"
              className="text-accent underline underline-offset-4"
            >
              이용약관
            </Link>
            과{" "}
            <Link
              href="/privacy"
              className="text-accent underline underline-offset-4"
            >
              개인정보처리방침
            </Link>
            에 동의합니다. (필수)
          </span>
        </label>

        {errors.agree && (
          <p
            id="agree-error"
            className="text-error text-2xs flex gap-1.5 leading-relaxed"
          >
            <Warning
              size={13}
              weight="light"
              aria-hidden="true"
              className="mt-px shrink-0"
            />
            <span>{errors.agree}</span>
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="group bg-accent text-on-accent hover:bg-accent-hover shadow-button hover:shadow-button-hover tracking-button ease-fluid flex min-h-14 items-center justify-center gap-3 rounded-full text-sm transition-all duration-500 hover:-translate-y-px active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {pending ? "가입하는 중" : "가입하기"}
        {!pending && (
          <ArrowRight
            size={14}
            weight="light"
            aria-hidden="true"
            className="ease-fluid transition-transform duration-500 group-hover:translate-x-0.5"
          />
        )}
      </button>

      <p className="text-secondary mt-2 text-center text-2xs">
        이미 회원이신가요?{" "}
        <Link
          href="/login"
          className="text-accent ease-fluid underline underline-offset-4 transition-colors duration-300"
        >
          로그인
        </Link>
      </p>
    </form>
  );
}
