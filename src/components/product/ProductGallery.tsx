/**
 * 상품 이미지 갤러리.
 *
 * 촬영본이 오기 전까지는 옥스블러드 방사형 배경을 자리표시자로 쓴다.
 * **이건 UI 색이 아니라 사진 색이다.** 실제 제품 촬영본의 배경이 버건디이기 때문에,
 * 베이지 UI 위에 버건디 사진이 얹혔을 때의 인상을 미리 볼 수 있다.
 * (UI 에서 버건디를 뺀 이유가 바로 이것이다 — 사진이 이미 레드를 공급한다)
 *
 * 4:5 비율은 의류 촬영 표준이다. 세로가 길어야 전신 실루엣이 들어간다.
 *
 * 바깥 껍데기 + 안쪽 알맹이로 감싼다. 사진을 배경에 납작하게 얹으면 싸구려로 보이고,
 * 트레이에 담긴 것처럼 두면 물성이 생긴다.
 */

const PHOTO_PLACEHOLDER =
  "radial-gradient(ellipse at 50% 42%, #7B1526 0%, #4E0C17 55%, #1A0E12 100%)";

export function ProductGallery({ images }: { images: string[] }) {
  const hasImages = images.length > 0;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="border-subtle bg-band/50 shadow-soft rounded-[2rem] border p-2">
        <div
          className="relative aspect-[4/5] w-full overflow-hidden rounded-[calc(2rem-0.5rem)]"
          style={hasImages ? undefined : { background: PHOTO_PLACEHOLDER }}
        >
          {hasImages ? (
            // 정적 내보내기라 next/image 최적화가 동작하지 않는다 (images.unoptimized).
            // Phase 3 에서 BE 렌디션을 가리키는 커스텀 로더로 교체한다.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[0]}
              alt=""
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

      {/* 썸네일 — 촬영본이 없으면 자리만 잡아 둔다 */}
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`bg-band/60 ease-fluid aspect-[4/5] rounded-xl border transition-colors duration-500 ${
              i === 0 ? "border-accent" : "border-subtle"
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
