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
import { AUTH_MESSAGE, AuthError, SOCIAL_PROVIDERS, signIn } from "@/lib/auth";

/**
 * 로그인 폼.
 *
 * ── 검증을 언제 하는가 ──────────────────────────────────
 * 타이핑 중에는 오류를 띄우지 않는다. 이메일을 두 글자 쳤을 뿐인데 "형식이 올바르지
 * 않습니다" 가 뜨면 사용자는 아직 틀린 게 아니라 **쓰는 중**이다.
 * 제출한 뒤부터 그 칸을 다시 검증한다(submitted 플래그).
 *
 * ── 실패를 어디에 말하는가 ──────────────────────────────
 * 두 군데 다 말한다. 칸마다의 오류는 그 칸 아래에, 전체 실패는 폼 맨 위 요약에.
 * 요약만 있으면 어느 칸이 문제인지 모르고, 칸 오류만 있으면 화면 밖에 있을 때 못 본다.
 * 요약에는 초점을 옮긴다 — 스크린리더 사용자가 제출 직후 결과를 듣는다.
 *
 * ── 비밀번호 ────────────────────────────────────────────
 * 보기 토글은 button 이고 aria-pressed 로 상태를 알린다. 눈 아이콘만 바뀌면
 * 스크린리더에는 아무 일도 일어나지 않은 것과 같다.
 * 붙여넣기를 막지 않는다 — 비밀번호 관리자를 쓰는 사람이 더 안전한 비밀번호를 쓴다.
 */

interface Errors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): Errors {
  const errors: Errors = {};

  if (!email.trim()) {
    errors.email = "이메일을 입력해 주세요.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    // 이메일 형식 검사는 느슨하게 둔다. RFC 를 엄격히 따르면 실제로 쓰이는 주소를 막는다.
    errors.email = "이메일 형식이 올바르지 않습니다.";
  }

  if (!password) {
    errors.password = "비밀번호를 입력해 주세요.";
  }

  return errors;
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const summaryRef = useRef<HTMLDivElement>(null);

  // 제출 전에는 칸 오류를 보여주지 않는다
  const errors = submitted ? validate(email, password) : {};
  const hasFieldError = Object.keys(errors).length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);

    const found = validate(email, password);
    if (Object.keys(found).length > 0) {
      // 요약으로 초점을 옮겨 제출 결과를 듣게 한다
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setPending(true);
    try {
      await signIn({ email: email.trim(), password, remember });
      // Phase 5: 성공하면 원래 가려던 곳으로 보낸다
    } catch (err) {
      setFormError(
        err instanceof AuthError
          ? AUTH_MESSAGE[err.kind]
          : AUTH_MESSAGE.unknown,
      );
      requestAnimationFrame(() => summaryRef.current?.focus());
    } finally {
      setPending(false);
    }
  }

  const summary =
    formError ?? (hasFieldError ? "입력한 내용을 확인해 주세요." : null);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {/*
        오류 요약. tabIndex={-1} 은 마우스·키보드 순서에는 안 들어가지만
        코드로 초점을 줄 수 있게 한다. role="alert" 라 나타나는 즉시 읽힌다.
      */}
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
        label="이메일"
        type="email"
        name="email"
        // 브라우저·비밀번호 관리자가 채워 넣을 수 있게 한다
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        placeholder="name@example.com"
      />

      <Field
        label="비밀번호"
        type={visible ? "text" : "password"}
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            aria-label={visible ? "비밀번호 가리기" : "비밀번호 보기"}
            className="text-muted hover:text-velvet ease-fluid flex h-11 w-11 items-center justify-center rounded-lg transition-colors duration-300"
          >
            {visible ? (
              <EyeSlash size={18} weight="light" aria-hidden="true" />
            ) : (
              <Eye size={18} weight="light" aria-hidden="true" />
            )}
          </button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-secondary text-2xs flex min-h-11 cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="accent-velvet h-4 w-4"
          />
          로그인 유지
        </label>

        <Link
          href="/find"
          className="text-muted hover:text-velvet ease-fluid text-2xs underline underline-offset-4 transition-colors duration-300"
        >
          비밀번호를 잊으셨나요?
        </Link>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="group bg-accent text-on-dark hover:bg-accent-hover shadow-button hover:shadow-button-hover tracking-button ease-fluid flex min-h-14 items-center justify-center gap-3 rounded-full text-sm transition-all duration-500 hover:-translate-y-px active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {/*
          진행 중에는 라벨을 바꾼다. 버튼이 회색으로만 변하면 "눌렸나?" 를 모른다.
          너비가 흔들리지 않게 두 문구의 길이를 비슷하게 맞췄다.
        */}
        {pending ? "확인하는 중" : "로그인"}
        {!pending && (
          <ArrowRight
            size={14}
            weight="light"
            aria-hidden="true"
            className="ease-fluid transition-transform duration-500 group-hover:translate-x-0.5"
          />
        )}
      </button>

      {/*
        간편 로그인.
        TODO(고객확인) C-2 — 카카오·네이버 앱 등록은 고객사 명의로 해야 한다.
        지금은 자리만 잡아두고 비활성으로 둔다. 눌러도 아무 일이 없는 버튼보다
        "준비 중" 이라고 말하는 쪽이 낫다.
      */}
      <div className="border-subtle mt-2 flex items-center gap-4 border-t pt-7">
        <span className="text-muted text-2xs">간편 로그인</span>
        <span className="text-muted/70 text-2xs">준비 중</span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {SOCIAL_PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled
            className="border-subtle text-muted flex min-h-12 items-center justify-center rounded-full border text-2xs disabled:cursor-not-allowed"
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="text-secondary mt-2 text-center text-2xs">
        아직 회원이 아니신가요?{" "}
        <Link
          href="/signup"
          className="text-accent hover:text-velvet ease-fluid underline underline-offset-4 transition-colors duration-300"
        >
          회원가입
        </Link>
      </p>
    </form>
  );
}
