import { LINE_LABEL, type ProductLine } from "@/types/product";

/**
 * 라인 배지 — 레오네(클래식) · 페리토(애슬레틱).
 *
 * 일반 기성복 쇼핑몰에 없는 정보라 눈에 띄어야 한다.
 * 고동색 헤어라인 pill 을 쓴다: 베이지 배경 대비 9.64:1 로 AA 를 여유 있게 넘기고,
 * 브랜드 포인트 컬러라 이 배지가 곧 브랜드의 주장이 된다.
 *
 * 골드는 쓰지 않는다 — 라이트 배경에서 1.9:1 이라 테두리로도 안 보인다.
 */
export function LineBadge({ line }: { line: ProductLine }) {
  const label = LINE_LABEL[line];
  /*
    페리토(애슬레틱)만 골드다. 이 브랜드의 주장이 곧 이 배지다.
    레오네(클래식)는 헤어라인만 — 주장이 아니라 분류이기 때문이다.
    베이지 위 버건디 9.60:1, 옅은 버건디 바탕 위 8.4:1.
  */
  const athletic = line === "FERITO";

  return (
    <span
      className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 ${
        athletic
          ? "border-velvet/50 bg-velvet-tint text-accent"
          : "border-accent/40 text-accent"
      }`}
    >
      <span className="text-[10px] tracking-label leading-none">
        {label.en}
      </span>
      <span
        aria-hidden="true"
        className={`h-2.5 w-px ${athletic ? "bg-velvet/40" : "bg-accent/30"}`}
      />
      <span className="text-2xs leading-none">{label.ko}</span>
    </span>
  );
}

/**
 * 라인 이름 + 한 줄 설명. 이름만으로는 "페리토가 뭔데?" 가 남는다.
 * 2026-10-06 고객 요청으로 알약 모양 배지를 걷고 글자로만 둔다 — 상품 카드에서도 배지를 없앴다.
 */
export function LineSummary({ line }: { line: ProductLine }) {
  const label = LINE_LABEL[line];

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-accent text-2xs tracking-label">
        {label.en} · {label.ko} ({label.kind})
      </p>
      <p className="text-secondary text-sm">{label.description}</p>
    </div>
  );
}
