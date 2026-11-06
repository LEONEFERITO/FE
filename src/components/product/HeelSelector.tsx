"use client";

/**
 * 굽높이 고르기 (서버 V49, 2026-11-06 고객 "기본, 1 ~ 6cm 추가"). 추가 금액은 없다.
 * 사이즈 칸과 같은 모양의 둥근 네모 — 고른 칸은 회색 면. 라디오 그룹이라 키보드 · 화면 낭독기로도 고른다.
 * 사이즈보다 위에 둔다 — 구매 판은 사이즈를 누르는 순간 «고른 옵션» 줄이 생기므로, 굽을 먼저 골라 두어야 그 굽으로 담긴다.
 */
export function HeelSelector({
  heels,
  value,
  onChange,
}: {
  heels: string[];
  value: string | null;
  onChange: (heel: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="text-primary text-sm font-medium">
        굽높이<span className="text-muted ml-2 text-xs font-normal">추가 금액 없음</span>
      </h2>
      <div role="radiogroup" aria-label="굽높이" className="grid grid-cols-4 gap-2 lg:grid-cols-7">
        {heels.map((h) => {
          const on = value === h;
          return (
            <button
              key={h}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={h === "기본" ? "굽높이 기본" : `굽높이 ${h} 추가`}
              onClick={() => onChange(h)}
              className={`ease-fluid flex min-h-11 items-center justify-center rounded-[16px] border px-1 text-[13px] tabular-nums transition-all duration-300 ${
                on ? "text-primary border-[#EDEDED] bg-[#EDEDED] font-medium" : "text-primary border-[#DADADA] bg-white hover:border-[#BDBDBD] active:scale-[0.97]"
              }`}
            >
              {h}
            </button>
          );
        })}
      </div>
    </div>
  );
}
