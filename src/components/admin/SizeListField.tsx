"use client";

import { ArrowDown, ArrowUp, Plus, Warning, X } from "@phosphor-icons/react/dist/ssr";
import { useId } from "react";

import { countGraphemes } from "@/components/admin/CountedField";
import { LIMITS, type SkuImageKind } from "@/lib/admin";

/**
 * 사이즈 목록 — 상품이 어떤 사이즈로 만들어지는가.
 *
 * ── "제작 가능" 과 "재고" (2026-10-13 사이즈별 재고, 서버 V30) ──────────
 * 제작 가능 — 끄면 그 사이즈를 만들 수 없다는 뜻이다(손님 화면 "주문 불가").
 * 재고 — 비워 두면 수량을 세지 않는다(주문 후 제작, 지금까지의 방식). 숫자를 넣으면 그만큼만 팔리고,
 * 결제될 때 줄고 발송 전 취소면 돌아온다. 0 이면 손님 화면에 "품절", 5벌 이하면 "2벌 남음".
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
  /** 재고 칸에 적은 그대로. 빈칸 = 세지 않음 */
  stock: string;
  /** 이 사이즈를 누르면 보여 줄 메인 사진 칸(서버 V45). 빈 값 = 사진을 바꾸지 않음 */
  imageKind?: SkuImageKind | "";
}

/** 사이즈 사진으로 고를 수 있는 칸 — 상세 작은 사진 다섯 칸과 같은 순서 */
export const SKU_IMAGE_CHOICES: { value: SkuImageKind; label: string }[] = [
  { value: "MAIN", label: "대표" },
  { value: "WORN", label: "착용샷" },
  { value: "DETAIL", label: "디테일컷" },
  { value: "EXTRA_1", label: "추가 1" },
  { value: "EXTRA_2", label: "추가 2" },
];

/** 새 상품의 기본 사이즈. 이 브랜드의 기본 전개 (BRAND_BRIEF 참고). 관리자가 지우거나 바꾼다. */
export const DEFAULT_SIZES: SizeRow[] = ["95", "100", "105", "110"].map((size) => ({
  size,
  orderable: true,
  stock: "",
}));

/** 재고 칸 → 서버 값. 빈칸이면 null(세지 않음) */
export const stockValue = (row: SizeRow): number | null => (row.stock.trim() === "" ? null : Number(row.stock.trim()));

interface Props {
  value: SizeRow[];
  onChange: (next: SizeRow[]) => void;
  /** 제출 뒤에만 보이는 오류. 줄 번호 → 문구. */
  errors?: Record<number, string>;
  /** 재고 칸을 숨긴다 — 수트 조각 사이즈(2026-10-31 디자이너 "재고 표시할 이유 없다"). 비운 칸 = 세지 않음 */
  hideStock?: boolean;
  /** 사진 칸을 보인다 — 손님이 이 사이즈를 누르면 큰 사진이 그 칸 사진으로 바뀐다(2026-10-30 디자이너). 올린 칸만 고를 수 있다 */
  photoChoices?: { value: SkuImageKind; label: string }[];
}

export function SizeListField({ value, onChange, errors = {}, hideStock = false, photoChoices }: Props) {
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
    onChange([...value, { size: "", orderable: true, stock: "" }]);
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
                  {/* 재고 — 비우면 세지 않는다. 숫자 키패드가 뜨게 */}
                  <label className={`text-secondary min-h-11 shrink-0 items-center gap-2 text-xs ${hideStock ? "hidden" : "flex"}`}>
                    재고
                    <input
                      type="text"
                      inputMode="numeric"
                      value={row.stock}
                      onChange={(e) => update(i, { stock: e.target.value.replace(/[^0-9]/g, "") })}
                      placeholder="무제한"
                      aria-label={`${row.size || i + 1} 사이즈 재고 (비우면 수량을 세지 않음)`}
                      className={`text-primary placeholder:text-muted/70 ease-fluid min-h-11 w-20 rounded-lg border bg-transparent px-2.5 text-right text-sm tabular-nums transition-colors duration-300 ${
                        row.stock === "0" ? "border-error" : "border-interactive focus-visible:border-accent"
                      }`}
                    />
                    {row.stock === "0" && <span className="text-error text-2xs">품절</span>}
                  </label>
                  {/* 사이즈 사진 — 손님이 이 사이즈를 누르면 큰 사진이 이 칸으로 바뀐다 */}
                  {photoChoices && (
                    <label className="text-secondary flex min-h-11 shrink-0 items-center gap-2 text-xs">
                      사진
                      <select
                        value={row.imageKind ?? ""}
                        onChange={(e) => update(i, { imageKind: e.target.value as SkuImageKind | "" })}
                        aria-label={`${row.size || i + 1} 사이즈를 누르면 보여 줄 사진`}
                        className="text-primary border-interactive focus-visible:border-accent min-h-11 rounded-lg border bg-transparent px-2 text-xs"
                      >
                        <option value="">바꾸지 않음</option>
                        {photoChoices.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                        {/* 고른 칸의 사진을 지웠으면 — 값은 남기되 비었다고 보인다 */}
                        {row.imageKind && !photoChoices.some((c) => c.value === row.imageKind) && (
                          <option value={row.imageKind}>{SKU_IMAGE_CHOICES.find((c) => c.value === row.imageKind)?.label} (사진 없음)</option>
                        )}
                      </select>
                    </label>
                  )}
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
    if (row.stock.trim() !== "" && !(Number(row.stock) >= 0 && Number(row.stock) <= 99999)) {
      errors[i] = "재고는 0 ~ 99999 사이 숫자로 적거나 비워 두세요.";
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
