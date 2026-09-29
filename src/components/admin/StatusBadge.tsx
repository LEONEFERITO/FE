import { STATUS_LABEL, type ProductStatus } from "@/lib/admin";

/**
 * 상품 상태 표시. 색만으로 구분하지 않는다 — 글자가 항상 함께 있다.
 * 공개만 강조색이다. 관리자가 한눈에 찾아야 하는 건 "지금 손님이 보는 것" 이다.
 */
export function StatusBadge({ status }: { status: ProductStatus }) {
  const tone =
    status === "PUBLISHED"
      ? "border-accent/60 text-accent"
      : "border-subtle text-muted";
  return (
    <span
      className={`text-2xs inline-flex items-center rounded-full border px-2.5 py-0.5 tracking-wide ${tone}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
