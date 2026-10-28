import type { ProductPhoto } from "@/types/product";

/**
 * 상품 큰 사진 — 상세 맨 위 왼쪽.
 *
 * 2026-10-28 디자이너: 테두리 · 판(액자) 없이 사진만. 작은 사진 줄은 오른쪽 구매 판으로 옮겼다(PurchasePanel) —
 * 어떤 사진을 크게 볼지는 ProductTop 이 들고 있는 번호(index)로 정한다.
 *
 * 촬영본이 오기 전까지는 옥스블러드 방사형 배경을 자리표시자로 쓴다.
 * **이건 UI 색이 아니라 사진 색이다.** 실제 제품 촬영본의 배경이 버건디라 그 인상을 미리 볼 수 있게 한다.
 *
 * 4:5 비율은 의류 촬영 표준이다. 세로가 길어야 전신 실루엣이 들어간다.
 */

const PHOTO_PLACEHOLDER =
  "radial-gradient(ellipse at 50% 42%, #7B1526 0%, #4E0C17 55%, #1A0E12 100%)";

export function ProductGallery({ photos, name, index = 0 }: { photos: ProductPhoto[]; name: string | null; index?: number }) {
  const i = Math.min(index, photos.length - 1);
  const photo = photos[i] ?? null;
  const alt = photo ? photo.alt || (name ? `${name} 사진 ${i + 1}` : `제품 사진 ${i + 1}`) : "";

  return (
    <div
      className="relative aspect-[4/5] w-full min-w-0 overflow-hidden"
      style={photo ? undefined : { background: PHOTO_PLACEHOLDER }}
    >
      {photo ? (
        // 정적 내보내기라 next/image 최적화가 동작하지 않는다 (images.unoptimized).
        // eslint-disable-next-line @next/next/no-img-element
        <img key={photo.url} src={photo.url} alt={alt} className="h-full w-full object-cover" loading="eager" />
      ) : (
        <p className="absolute left-7 top-7 text-sm text-white/55">제품 촬영본 준비 중 · 4:5 비율</p>
      )}
    </div>
  );
}
