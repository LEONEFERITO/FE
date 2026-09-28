/**
 * 섹션 눈썹 라벨 — 짧은 골드 선 + 골드 소문자 자간 라벨.
 *
 * 선까지 골드인 이유: 딥 와인 전환 때 글자만 골드로 바뀌고 선은 버건디로 남아 있었다.
 * 버건디 선(#7B1526)은 바닥(#170A0E) 위에서 1.9:1 이라 **사실상 안 보인다.**
 * 모든 구간 머리에 반복되는 표시가 한쪽만 사라지면 라벨이 한쪽으로 기울어 보인다.
 *
 * 이 라벨은 페이지의 모든 구간 머리에 같은 모양으로 반복되므로, 면적은 거의 없는데도
 * "이 사이트의 금색 점" 으로 읽힌다. 와인 바닥 위 골드 9.23:1 — 본문 기준 AA 를 넘긴다.
 */
export function Eyebrow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-accent text-2xs tracking-label flex items-center gap-3 ${className}`}
    >
      <span aria-hidden="true" className="bg-accent h-[2px] w-6 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
