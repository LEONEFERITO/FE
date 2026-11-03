"use client";

import { ArrowDown, ArrowUp, Plus, Warning, X } from "@phosphor-icons/react/dist/ssr";
import { useId } from "react";

/**
 * 컬러 옵션 입력 (서버 V46, 2026-11-03 고객 "컬러 색깔 관리자가 넣을 수 있게, 컬러 이름도 관리자가 적고 수정").
 *
 * 줄마다 동그라미 색(색 고르기 · #RRGGBB 직접 입력)과 이름. 위아래로 순서를 바꾸고 지울 수 있다 — 손님 화면에 이 순서로 나온다.
 * 자주 쓰는 색은 아래 단추로 한 번에 넣는다. 비워 두면 컬러를 고르지 않는 상품이다(지금까지처럼).
 * 이름은 장바구니 · 주문서 · 송장 엑셀에 그대로 나간다. 구성 줄을 나누는 글자(/ ·)는 쓸 수 없다.
 */

export interface ColorRow {
  name: string;
  hex: string;
}

export const COLOR_MAX = 12;

/** 자주 쓰는 색 — 누르면 한 줄로 들어온다. 이름 · 색은 넣은 뒤에 고칠 수 있다 */
const PRESETS: ColorRow[] = [
  { name: "블랙", hex: "#111111" },
  { name: "네이비", hex: "#1E2A44" },
  { name: "차콜", hex: "#3A3D42" },
  { name: "그레이", hex: "#8A8A8A" },
  { name: "화이트", hex: "#FFFFFF" },
  { name: "아이보리", hex: "#F3EEDF" },
  { name: "베이지", hex: "#D7C6A5" },
  { name: "브라운", hex: "#5B3A29" },
  { name: "버건디", hex: "#5E1F21" },
];

const HEX = /^#[0-9A-Fa-f]{6}$/;

/** 줄 번호 → 오류 문구. 제출 뒤에 보인다 */
export function validateColors(rows: ColorRow[]): Record<number, string> {
  const errors: Record<number, string> = {};
  const seen = new Set<string>();
  rows.forEach((r, i) => {
    const name = r.name.trim();
    const key = name.toLowerCase();
    if (!name) errors[i] = "컬러 이름을 적어 주세요.";
    else if (name.length > 20) errors[i] = "이름은 20자까지입니다.";
    else if (/[/·]/.test(name)) errors[i] = "이름에 / 와 · 는 쓸 수 없습니다.";
    else if (seen.has(key)) errors[i] = "같은 이름이 이미 있습니다.";
    else if (!HEX.test(r.hex)) errors[i] = "색은 #RRGGBB 로 적어 주세요.";
    seen.add(key);
  });
  return errors;
}

export function ColorListField({
  value,
  onChange,
  errors = {},
}: {
  value: ColorRow[];
  onChange: (next: ColorRow[]) => void;
  errors?: Record<number, string>;
}) {
  const baseId = useId();
  const update = (i: number, patch: Partial<ColorRow>) => onChange(value.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const full = value.length >= COLOR_MAX;
  const unused = PRESETS.filter((p) => !value.some((r) => r.name.trim() === p.name));

  return (
    <div className="flex flex-col gap-4">
      {value.length === 0 ? (
        <p className="border-subtle bg-band/60 text-muted text-2xs rounded-xl border px-4 py-3 leading-relaxed">
          컬러를 넣지 않으면 손님은 사이즈만 고릅니다. 컬러가 여러 개인 상품은 아래에서 추가해 주세요 — 손님이 컬러와 사이즈를 고르고 줄마다 수량을 정합니다.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {value.map((row, i) => {
            const id = `${baseId}-color-${i}`;
            const error = errors[i];
            const valid = HEX.test(row.hex);
            return (
              <li key={i} className="border-subtle bg-surface flex min-w-0 flex-col gap-2 rounded-xl border px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="text-muted text-2xs w-5 shrink-0 tabular-nums" aria-hidden="true">
                    {i + 1}
                  </span>
                  {/* 색 고르기 — 브라우저의 색 판. 고른 값이 아래 #RRGGBB 칸에도 들어간다 */}
                  <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-[#CFCFCF]">
                    <span className="sr-only">{row.name || `${i + 1}번째 컬러`} 색 고르기</span>
                    <span aria-hidden="true" className="absolute inset-0" style={{ background: valid ? row.hex : "#FFFFFF" }} />
                    <input
                      type="color"
                      value={valid ? row.hex.toLowerCase() : "#ffffff"}
                      onChange={(e) => update(i, { hex: e.target.value.toUpperCase() })}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                  <label htmlFor={`${id}-hex`} className="sr-only">
                    {i + 1}번째 컬러 색 값
                  </label>
                  <input
                    id={`${id}-hex`}
                    type="text"
                    value={row.hex}
                    onChange={(e) => update(i, { hex: e.target.value.trim() })}
                    placeholder="#111111"
                    maxLength={7}
                    className="text-primary border-interactive focus-visible:border-accent min-h-11 w-[6.5rem] shrink-0 rounded-lg border bg-transparent px-2.5 font-mono text-xs uppercase"
                  />
                  <label htmlFor={`${id}-name`} className="sr-only">
                    {i + 1}번째 컬러 이름
                  </label>
                  <input
                    id={`${id}-name`}
                    type="text"
                    value={row.name}
                    onChange={(e) => update(i, { name: e.target.value })}
                    placeholder="컬러 이름 (예: 블랙)"
                    maxLength={20}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${id}-error` : undefined}
                    className={`text-primary placeholder:text-muted/70 min-h-11 w-full min-w-0 rounded-lg border bg-transparent px-3 text-sm ${
                      error ? "border-error" : "border-interactive focus-visible:border-accent"
                    }`}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                  <IconButton label={`${row.name || i + 1} 위로`} onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowUp size={14} weight="light" aria-hidden="true" />
                  </IconButton>
                  <IconButton label={`${row.name || i + 1} 아래로`} onClick={() => move(i, 1)} disabled={i === value.length - 1}>
                    <ArrowDown size={14} weight="light" aria-hidden="true" />
                  </IconButton>
                  <IconButton label={`${row.name || i + 1} 삭제`} onClick={() => onChange(value.filter((_, k) => k !== i))} danger>
                    <X size={14} weight="light" aria-hidden="true" />
                  </IconButton>
                </div>
                {error && (
                  <p id={`${id}-error`} className="text-error text-2xs flex w-full gap-1.5 sm:basis-full">
                    <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
                    <span>{error}</span>
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange([...value, { name: "", hex: "#111111" }])}
          disabled={full}
          className="border-interactive text-primary hover:border-accent hover:text-accent ease-fluid inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-xs transition-colors duration-300 disabled:opacity-45"
        >
          <Plus size={13} weight="light" aria-hidden="true" />
          컬러 추가
        </button>
        {!full &&
          unused.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => onChange([...value, p])}
              className="border-subtle text-secondary hover:text-primary hover:border-interactive ease-fluid inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors duration-300"
            >
              <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full ring-1 ring-[#CFCFCF]" style={{ background: p.hex }} />
              {p.name}
            </button>
          ))}
      </div>
      {full && <p className="text-muted text-2xs">컬러는 {COLOR_MAX}개까지 넣을 수 있습니다.</p>}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
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
      className={`ease-fluid inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300 disabled:opacity-30 ${
        danger ? "text-muted hover:text-error" : "text-secondary hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}
