import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";

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
 *
 * 사진이 둘 이상이면 좌우 가운데에 넘기기 버튼(2026-10-31 디자이너 "사진 여기서도 넘겨볼 수 있도록") — 끝에서 처음으로 돈다.
 * 2026-10-30 디자이너 "동그라미 크기 줄여 주세요": 보이는 동그라미는 32px, 누르는 자리는 44px 그대로(손가락 기준).
 */

const PHOTO_PLACEHOLDER =
  "radial-gradient(ellipse at 50% 42%, #7B1526 0%, #4E0C17 55%, #1A0E12 100%)";

export function ProductGallery({
  photos,
  name,
  index = 0,
  onIndex,
}: {
  photos: ProductPhoto[];
  name: string | null;
  index?: number;
  /** 넘기기 버튼이 고른 번호 — 없으면 버튼을 그리지 않는다 */
  onIndex?: (i: number) => void;
}) {
  const i = Math.min(index, photos.length - 1);
  const photo = photos[i] ?? null;
  const alt = photo ? photo.alt || (name ? `${name} 사진 ${i + 1}` : `제품 사진 ${i + 1}`) : "";

  return (
    <div
      // 4:5 가 기본이고, PC 에서 옆 구매 판이 더 길면 그 높이까지 늘어난다(lg:h-full — 사진은 가운데 기준으로 잘린다)
      className="relative aspect-[4/5] w-full min-w-0 overflow-hidden lg:h-full"
      style={photo ? undefined : { background: PHOTO_PLACEHOLDER }}
    >
      {photo ? (
        // 정적 내보내기라 next/image 최적화가 동작하지 않는다 (images.unoptimized).
        // eslint-disable-next-line @next/next/no-img-element
        <img key={photo.url} src={photo.url} alt={alt} className="h-full w-full object-cover" loading="eager" />
      ) : (
        <p className="absolute left-7 top-7 text-sm text-white/55">제품 촬영본 준비 중 · 4:5 비율</p>
      )}
      {onIndex && photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => onIndex((i - 1 + photos.length) % photos.length)}
            aria-label="이전 사진"
            className="group absolute left-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center md:left-2.5"
          >
            <span className="ease-fluid flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-[#1a1a1a] shadow-[0_2px_8px_rgba(0,0,0,0.16)] backdrop-blur-sm transition-colors duration-300 group-hover:bg-white">
              <CaretLeft size={14} weight="regular" aria-hidden="true" />
            </span>
          </button>
          <button
            type="button"
            onClick={() => onIndex((i + 1) % photos.length)}
            aria-label="다음 사진"
            className="group absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center md:right-2.5"
          >
            <span className="ease-fluid flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-[#1a1a1a] shadow-[0_2px_8px_rgba(0,0,0,0.16)] backdrop-blur-sm transition-colors duration-300 group-hover:bg-white">
              <CaretRight size={14} weight="regular" aria-hidden="true" />
            </span>
          </button>
          <p aria-live="polite" className="sr-only">
            {i + 1} / {photos.length}
          </p>
        </>
      )}
    </div>
  );
}
