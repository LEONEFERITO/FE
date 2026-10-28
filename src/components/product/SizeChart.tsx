import type { SizeChartImage } from "@/types/product";

/**
 * 상세 사이즈 차트 — 관리자가 올린 표 이미지 한 장.
 *
 * 2026-10-28 디자이너 요청으로 제목("SIZE 상세 사이즈") · 크게 보기 · "표가 작게 보이면…" 안내 · 측정 기준 줄을 걷었다.
 * 표 이미지 자체에 제목 · 기준이 들어 있다. 대체 텍스트(관리자 입력)는 그대로 — 화면을 읽어 주는 기기에는 이게 표의 전부다.
 * 차트가 없으면 아무것도 그리지 않는다.
 */
export function SizeChart({ chart }: { chart: SizeChartImage | null }) {
  if (!chart) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={chart.url}
      alt={chart.alt}
      width={chart.width ?? undefined}
      height={chart.height ?? undefined}
      loading="lazy"
      decoding="async"
      className="mx-auto block h-auto w-full"
    />
  );
}
