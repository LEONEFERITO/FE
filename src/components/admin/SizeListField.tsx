"use client";

import { ArrowDown, ArrowUp, Plus, Warning, X } from "@phosphor-icons/react/dist/ssr";
import { useId } from "react";

import { countGraphemes } from "@/components/admin/CountedField";
import { LIMITS } from "@/lib/admin";

/**
 * 사이즈 목록 — 상품이 어떤 사이즈로 만들어지는가.
 *
 * ── "제작 가능" 이지 "재고" 가 아니다 ────────────────────
 * 이 브랜드는 주문 후 제작이라 재고 개념이 없다. 체크를 끄면 손님에게 그 사이즈가
 * "만들 수 없음" 으로 보인다(취소선). 품절이 아니다 — 화면 문구도 그렇게 쓴다.
 *
 * ── 순서는 사람이 정한다 ────────────────────────────────
 * 문자열로 정렬하면 100 이 95 앞에 오고, 숫자로 바꾸면 S/M/L 이 들어오는 순간 깨진다.
 * 그래서 위·아래 버튼으로 관리자가 놓은 순서를 그대로 저장한다 (서버도 그 순서를 쓴다).
 *
 * ── 실측값은 여기서 다루지 않는다 ───────────────────────
 * 상세 사이즈는 차트 이미지로 가기로 했다(고객 결정). 서버의 실측 칸은 남아 있어서,
 * 수정 때 원래 실측이 있으면 같은 사이즈 이름인 한 그대로 보존된다 (ProductForm 참고).
 */

export interface SizeRow {
  size: string;
  orderable: boolean;
}

/** 새 상품의 기본 사이즈. 이 브랜드의 기본 전개 (BRAND_BRIEF 참고). 관리자가 지우거나 바꾼다. */
export const DEFAULT_SIZES: SizeRow[] = ["95", "100", "105", "110"].map((size) => ({
  size,
  orderable: true,
}));

interface Props {
  value: SizeRow[];
  onChange: (next: SizeRow[]) => void;
  /** 제출 뒤에만 보이는 오류. 줄 번호 → 문구. */
  errors?: Record<number, string>;
}

export function SizeListField({ value, onChange, errors = {} }: Props) {
  const baseId = useId();

  function update(i: number, patch: Partial<SizeRow>) {
    onChange(value.map((row, k) => (k === i ? { ...row, ...patch } : row)));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  function remove(i: number) {
    onChange(value.filter((_, k) => k !== i));
  }

  function add() {
    onChange([...value, { size: "", orderable: true }]);
  }

  return (
    <div className="flex flex-col gap-4">
      {value.length === 0 ? (
        <p className="border-subtle bg-band/60 text-muted text-2xs rounded-xl border px-4 py-3 leading-relaxed">
          사이즈가 없으면 손님이 고를 것이 없어 장바구니에 담지 못합니다. 하나 이상 추가해 주세요.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {value.map((row, i) => {
            const inputId = `${baseId}-size-${i}`;
            const errorId = `${inputId}-error`;
            const error = errors[i];
            return (
              <li
                key={i}
                className="border-subtle bg-surface flex min-w-0 flex-col gap-2 rounded-xl border px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="text-muted text-2xs w-5 shrink-0 tabular-nums" aria-hidden="true">
                    {i + 1}
                  </span>
                  <label htmlFor={inputId} className="sr-only">
                    {i + 1}번째 사이즈 이름
                  </label>
                  <input
                    id={inputId}
                    type="text"
                    value={row.size}
                    onChange={(e) => update(i, { size: e.target.value })}
                    placeholder="95"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    className={`text-primary placeholder:text-muted/70 ease-fluid min-h-11 w-full min-w-0 rounded-lg border bg-transparent px-3 text-sm transition-colors duration-300 sm:max-w-[9rem] ${
                      error ? "border-error" : "border-interactive focus-visible:border-accent"
                    }`}
                  />
                  <label className="text-secondary flex min-h-11 shrink-0 cursor-pointer items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={row.orderable}
                      onChange={(e) => update(i, { orderable: e.target.checked })}
                      className="accent-[var(--accent-base)] h-4 w-4"
                    />
                    제작 가능
                  </label>
                </div>

                <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                  <IconButton label={`${row.size || i + 1} 위로`} onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowUp size={14} weight="light" aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    label={`${row.size || i + 1} 아래로`}
                    onClick={() => move(i, 1)}
                    disabled={i === value.length - 1}
                  >
                    <ArrowDown size={14} weight="light" aria-hidden="true" />
                  </IconButton>
                  <IconButton label={`${row.size || i + 1} 삭제`} onClick={() => remove(i)} danger>
                    <X size={14} weight="light" aria-hidden="true" />
                  </IconButton>
                </div>

                {error && (
                  <p id={errorId} className="text-error text-2xs flex w-full gap-1.5 sm:basis-full">
                    <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
                    <span>{error}</span>
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <button
        type="button"
        onClick={add}
        className="border-interactive text-accent hover:border-accent hover:bg-accent-tint ease-fluid text-2xs inline-flex min-h-11 w-fit items-center gap-2 rounded-full border px-5 transition-all duration-300"
      >
        <Plus size={13} weight="light" aria-hidden="true" />
        사이즈 추가
      </button>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled = false,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`ease-fluid flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300 disabled:opacity-30 ${
        danger ? "text-muted hover:text-error" : "text-muted hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * 제출 때만 검사한다. 입력 중에 빨간 줄이 뜨면 아직 안 친 글자를 틀렸다고 하는 셈이다.
 * 반환값이 비면 통과.
 */
export function validateSizes(rows: SizeRow[]): Record<number, string> {
  const errors: Record<number, string> = {};
  const seen = new Map<string, number>();
  rows.forEach((row, i) => {
    const name = row.size.trim();
    if (!name) {
      errors[i] = "사이즈 이름을 입력하거나 줄을 지워 주세요.";
      return;
    }
    if (countGraphemes(name) > LIMITS.size) {
      errors[i] = `${LIMITS.size}자를 넘었습니다.`;
      return;
    }
    const dup = seen.get(name);
    if (dup !== undefined) {
      errors[i] = `${dup + 1}번째와 같은 사이즈입니다.`;
      return;
    }
    seen.set(name, i);
  });
  return errors;
}
