"use client";

import type { ProductColor } from "@/types/product";

/**
 * 컬러 고르기 (서버 V46, 2026-11-03 고객 "컬러 선택 가능하게 · 컬러 이름은 관리자가").
 *
 * 동그라미(관리자가 정한 색) 아래에 이름을 적는다 — 색만으로 고르게 하지 않는다(색약 · WCAG 1.4.1).
 * 고른 컬러 이름은 제목 옆에도 한 번 더 보인다. 라디오 그룹이라 키보드 · 화면 낭독기로도 고를 수 있다.
 */
export function ColorSelector({
  colors,
  value,
  onChange,
}: {
  colors: ProductColor[];
  value: string | null;
  onChange: (name: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="text-primary text-sm font-medium">
        컬러{value && <span className="text-secondary ml-2 font-normal">{value}</span>}
      </h2>
      <div role="radiogroup" aria-label="컬러" className="flex flex-wrap gap-x-4 gap-y-3">
        {colors.map((c) => {
          const on = value === c.name;
          return (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(c.name)}
              className="group flex min-h-11 min-w-11 flex-col items-center gap-1.5"
            >
              <span
                aria-hidden="true"
                className={`ease-fluid block h-7 w-7 rounded-full ring-offset-2 transition-shadow duration-300 ${
                  on ? "ring-primary ring-2" : "ring-1 ring-[#CFCFCF] group-hover:ring-[#9A9A9A]"
                }`}
                style={{ background: c.hex }}
              />
              <span className={`text-[11px] leading-none ${on ? "text-primary font-medium" : "text-secondary"}`}>{c.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
