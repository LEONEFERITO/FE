import { FIT_LABEL, type FitType } from "@/types/product";

/**
 * 핏 배지 — 이 사이트의 존재 이유.
 *
 * 일반 기성복 쇼핑몰에 없는 정보라 눈에 띄어야 한다.
 * 고동색 헤어라인 pill 을 쓴다: 베이지 배경 대비 9.64:1 로 AA 를 여유 있게 넘기고,
 * 브랜드 포인트 컬러라 이 배지가 곧 브랜드의 주장이 된다.
 *
 * 골드는 쓰지 않는다 — 라이트 배경에서 1.9:1 이라 테두리로도 안 보인다.
 */
export function FitBadge({ fitType }: { fitType: FitType }) {
  const fit = FIT_LABEL[fitType];
  /*
    운동체형만 버건디다. 이 브랜드의 주장이 곧 이 배지고, 사진의 버건디와 같은 색이라
    목록에서 배지가 사진과 짝을 이룬다. 일반체형은 고동 헤어라인 — 주장이 아니라 분류다.
    베이지 위 버건디 9.60:1, 옅은 버건디 바탕 위 8.4:1.
  */
  const athletic = fitType === "ATHLETIC";

  return (
    <span
      className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 ${
        athletic
          ? "border-velvet/50 bg-velvet-tint text-velvet"
          : "border-accent/40 text-accent"
      }`}
    >
      <span className="text-[10px] tracking-label leading-none">{fit.en}</span>
      <span
        aria-hidden="true"
        className={`h-2.5 w-px ${athletic ? "bg-velvet/40" : "bg-accent/30"}`}
      />
      <span className="text-2xs leading-none">{fit.ko}</span>
    </span>
  );
}

/** 핏 배지 + 한 줄 설명. 배지만으로는 "운동체형이 뭔데?" 가 남는다. */
export function FitSummary({ fitType }: { fitType: FitType }) {
  const fit = FIT_LABEL[fitType];

  return (
    <div className="flex flex-col gap-3.5">
      <FitBadge fitType={fitType} />
      <p className="text-secondary text-sm">{fit.description}</p>
    </div>
  );
}
