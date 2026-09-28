/**
 * 섹션 눈썹 라벨 — 짧은 버건디 선 + 버건디 소문자 자간 라벨.
 *
 * 버건디는 넓은 면에 쓰지 않는다(고객 지정: 메인은 베이지·화이트, 버건디는 서브).
 * 그 대신 **작게, 자주** 쓴다. 이 라벨은 페이지의 모든 구간 머리에 같은 모양으로 반복되므로,
 * 면적은 거의 없는데도 "이 사이트의 붉은 점" 으로 읽힌다. 사진의 버건디 배경과 호응한다.
 *
 * 베이지(#F7F3EC) 위 버건디 글자는 9.60:1, 밴드(#EFE7D9) 위는 8.9:1 — 본문 기준 AA 를 넘긴다.
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
      className={`text-velvet text-2xs tracking-label flex items-center gap-3 ${className}`}
    >
      <span aria-hidden="true" className="bg-velvet h-[2px] w-6 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
