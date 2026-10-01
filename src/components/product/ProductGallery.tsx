import type { ProductPhoto } from "@/types/product";

/**
 * 상품 대표 사진 — 한 장.
 *
 * 썸네일 줄을 두지 않는다(고객 요청, 2026-09-30). 착용컷·디테일컷은 아래 "제품 상세"
 * 구간에 이어서 놓인다. 구매 판 옆에서는 사진 한 장이 옷을 보여주고, 나머지는
 * 스크롤하며 본다 — 썸네일을 눌러 바꾸는 일이 없어진다.
 *
 * 촬영본이 오기 전까지는 옥스블러드 방사형 배경을 자리표시자로 쓴다.
 * **이건 UI 색이 아니라 사진 색이다.** 실제 제품 촬영본의 배경이 버건디라
 * 그 인상을 미리 볼 수 있게 한다.
 *
 * 4:5 비율은 의류 촬영 표준이다. 세로가 길어야 전신 실루엣이 들어간다.
 */

const PHOTO_PLACEHOLDER =
  "radial-gradient(ellipse at 50% 42%, #7B1526 0%, #4E0C17 55%, #1A0E12 100%)";

export function ProductGallery({
  photo,
  name,
}: {
  photo: ProductPhoto | null;
  name: string | null;
}) {
  const image = photo?.url ?? null;
  return (
    <div className="border-subtle bg-band/50 shadow-soft min-w-0 rounded-[2rem] border p-2">
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-[calc(2rem-0.5rem)]"
        style={image ? undefined : { background: PHOTO_PLACEHOLDER }}
      >
        {image ? (
          // 정적 내보내기라 next/image 최적화가 동작하지 않는다 (images.unoptimized).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            // 상품 사진은 장식이 아니다. 이 사진이 곧 "무엇을 파는가" 다.
            // 관리자가 적은 대체 텍스트가 먼저다. 없을 때만 이름으로 만든다.
            alt={photo?.alt || (name ? `${name} 대표 사진` : "제품 대표 사진")}
            className="h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <p className="absolute left-7 top-7 text-sm text-white/55">
            제품 촬영본 준비 중 · 4:5 비율
          </p>
        )}
      </div>
    </div>
  );
}
