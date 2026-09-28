"use client";

import { Warning } from "@phosphor-icons/react/dist/ssr";
import { useId } from "react";

/**
 * 입력 한 칸 — 라벨 · 입력 · 도움말 · 오류.
 *
 * 로그인·회원가입·찾기·주소록이 전부 같은 규칙을 쓰도록 여기 한 번만 정한다.
 * 화면마다 따로 짜면 오류 문구 위치나 aria 연결이 한쪽만 맞는 날이 온다.
 *
 * ── 지키는 것 ──────────────────────────────────────────
 * · 라벨은 **입력 위에 보이게** 둔다. placeholder 를 라벨 대신 쓰면 값을 입력하는 순간
 *   무엇을 적는 칸이었는지 사라지고, 스크린리더도 일관되게 읽지 못한다.
 * · 오류는 **그 칸 바로 아래**에 글자로 말한다. 색만으로 알리지 않는다.
 * · aria-describedby 로 도움말과 오류를 입력에 연결한다. aria-invalid 로 상태를 알린다.
 * · 입력 높이는 48px 이상 — 모바일에서 누르기 쉬워야 한다.
 * · 붙여넣기를 막지 않는다. 비밀번호 관리자를 쓰지 못하게 하는 것은 WCAG 2.2 위반이다.
 */

interface Props extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id"
> {
  label: string;
  /** 입력 아래 상시 안내. 오류가 아니다. */
  hint?: string;
  /** 있으면 오류 상태가 된다. */
  error?: string;
  /** 오른쪽 끝에 붙는 것 (비밀번호 보기 토글 등) */
  trailing?: React.ReactNode;
}

export function Field({
  label,
  hint,
  error,
  trailing,
  className = "",
  ...input
}: Props) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="text-secondary text-2xs">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`text-primary placeholder:text-muted/70 ease-fluid w-full rounded-xl border bg-transparent px-4 py-3.5 text-sm transition-colors duration-300 ${
            error
              ? "border-error"
              : "border-interactive focus-visible:border-accent"
          } ${trailing ? "pr-12" : ""} ${className}`}
          {...input}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-1.5 flex items-center">
            {trailing}
          </span>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="text-muted text-2xs leading-relaxed">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          className="text-error text-2xs flex gap-1.5 leading-relaxed"
        >
          {/* 색만으로 알리지 않는다 — 아이콘과 글자가 같이 간다 */}
          <Warning
            size={13}
            weight="light"
            aria-hidden="true"
            className="mt-px shrink-0"
          />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
