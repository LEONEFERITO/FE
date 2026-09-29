"use client";

import { Warning } from "@phosphor-icons/react/dist/ssr";
import { useId } from "react";

/**
 * 글자 수를 세는 입력 칸.
 *
 * ── 왜 잘라내지 않고 세기만 하는가 ──────────────────────
 * `maxLength` 로 막으면 상한을 넘는 순간 <b>말없이 입력이 안 먹는다.</b> 붙여넣기를 하면
 * 뒷부분이 소리 없이 사라지는데, 쓰는 사람은 다 들어간 줄 안다. 그게 더 나쁘다.
 * 그래서 입력은 받되 <b>세어서 보여주고</b>, 넘으면 저장을 막는다.
 *
 * ── 왜 글자 수 상한이 필요한가 ──────────────────────────
 * 이 값들은 카드·목록·배너처럼 <b>크기가 정해진 자리</b>에 놓인다.
 * 상한이 없으면 붙여넣은 긴 문장이 카드 높이를 밀어내 격자가 어긋나고,
 * 모바일에서는 제목이 다섯 줄이 되어 가격과 버튼이 화면 밖으로 나간다.
 * 숫자는 "그 글자가 실제로 놓이는 자리" 에서 나왔다 (lib/admin.ts LIMITS).
 *
 * ── 한글 글자 수 ────────────────────────────────────────
 * `String.length` 는 UTF-16 단위를 센다. 한글 대부분은 1이지만 이모지는 2가 된다.
 * 사람이 세는 것과 맞추려면 문자소(grapheme) 단위여야 한다 — Intl.Segmenter 를 쓴다.
 * 서버는 같은 자리에서 `@Size` 로 <b>자바 String.length</b> 를 보므로,
 * 화면 상한을 서버보다 **같거나 작게** 두어 화면이 먼저 막게 한다.
 */

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("ko", { granularity: "grapheme" })
    : null;

/** 사람이 세는 방식으로 글자 수를 센다. */
export function countGraphemes(text: string): number {
  if (!segmenter) return text.length; // 아주 오래된 브라우저 — 근사치로 둔다
  let n = 0;
  for (const _ of segmenter.segment(text)) n++;
  return n;
}

interface Props {
  label: string;
  value: string;
  onChange: (next: string) => void;
  max: number;
  hint?: string;
  error?: string;
  placeholder?: string;
  /** 여러 줄 입력. 설명·본문처럼 긴 글에 쓴다. */
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  inputMode?: "text" | "numeric" | "email" | "tel";
}

export function CountedField({
  label,
  value,
  onChange,
  max,
  hint,
  error,
  placeholder,
  multiline = false,
  rows = 4,
  required = false,
  inputMode,
}: Props) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const countId = `${id}-count`;

  const count = countGraphemes(value);
  const over = count > max;
  const near = !over && count > max * 0.9;

  const describedBy = [hint ? hintId : null, countId, error || over ? errorId : null]
    .filter(Boolean)
    .join(" ");

  const shownError = error ?? (over ? `${max}자를 넘었습니다.` : undefined);

  const common = {
    id,
    value,
    placeholder,
    inputMode,
    "aria-invalid": shownError ? (true as const) : undefined,
    "aria-describedby": describedBy,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    className: `text-primary placeholder:text-muted/70 ease-fluid w-full rounded-xl border bg-transparent px-4 py-3.5 text-sm transition-colors duration-300 ${
      shownError ? "border-error" : "border-interactive focus-visible:border-accent"
    }`,
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-secondary text-2xs">
          {label}
          {required && (
            <span className="text-accent ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>

        {/*
          글자 수는 aria-live 로 읽지 않는다. 한 글자마다 소리가 나면 입력을 방해한다.
          대신 aria-describedby 로 입력에 묶여 있어, 칸에 들어오면 한 번 읽힌다.
          넘었을 때는 아래 오류 문구가 role="alert" 없이도 describedby 로 전달된다.
        */}
        <span
          id={countId}
          className={`text-2xs tabular-nums ${
            over ? "text-error" : near ? "text-warning" : "text-muted"
          }`}
        >
          {count} / {max}
        </span>
      </div>

      {multiline ? (
        <textarea {...common} rows={rows} className={`${common.className} resize-y`} />
      ) : (
        <input {...common} type="text" />
      )}

      {hint && !shownError && (
        <p id={hintId} className="text-muted text-2xs leading-relaxed">
          {hint}
        </p>
      )}

      {shownError && (
        <p id={errorId} className="text-error text-2xs flex gap-1.5 leading-relaxed">
          <Warning
            size={13}
            weight="light"
            aria-hidden="true"
            className="mt-px shrink-0"
          />
          <span>{shownError}</span>
        </p>
      )}
    </div>
  );
}
