"use client";

import { useState } from "react";

import type { ProductPhoto } from "@/types/product";

/**
 * 상품 메인 사진 — 상세 맨 위, 구매 판 옆.
 *
 * 메인 사진(대표 · 착용 · 디테일)이 여러 장이면 아래 작은 사진을 눌러 바꿔 본다.
 * 한 장이면 작은 사진 줄을 두지 않는다. 긴 상세 이미지는 여기가 아니라 아래 "제품 상세" 에 이어 붙는다
 * (2026-10-02 — 메인 사진과 상세 이미지를 나눴다. 그 전에는 한 장만 두고 나머지를 아래로 내렸다).
 *
 * 촬영본이 오기 전까지는 옥스블러드 방사형 배경을 자리표시자로 쓴다.
 * **이건 UI 색이 아니라 사진 색이다.** 실제 제품 촬영본의 배경이 버건디라
 * 그 인상을 미리 볼 수 있게 한다.
 *
 * 4:5 비율은 의류 촬영 표준이다. 세로가 길어야 전신 실루엣이 들어간다.
 */

const PHOTO_PLACEHOLDER =
  "radial-gradient(ellipse at 50% 42%, #7B1526 0%, #4E0C17 55%, #1A0E12 100%)";

export function ProductGallery({ photos, name }: { photos: ProductPhoto[]; name: string | null }) {
  const [index, setIndex] = useState(0);
  const photo = photos[Math.min(index, photos.length - 1)] ?? null;
  const altOf = (p: ProductPhoto, i: number) =>
    p.alt || (name ? `${name} 사진 ${i + 1}` : `제품 사진 ${i + 1}`);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="border-subtle bg-band/50 shadow-soft min-w-0 rounded-[2rem] border p-2">
        <div
          className="relative aspect-[4/5] w-full overflow-hidden rounded-[calc(2rem-0.5rem)]"
          style={photo ? undefined : { background: PHOTO_PLACEHOLDER }}
        >
          {photo ? (
            // 정적 내보내기라 next/image 최적화가 동작하지 않는다 (images.unoptimized).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.url}
              src={photo.url}
              // 상품 사진은 장식이 아니다. 관리자가 적은 대체 텍스트가 먼저다.
              alt={altOf(photo, index)}
              className="h-full w-full object-cover"
              loading="eager"
            />
          ) : (
            <p className="absolute left-7 top-7 text-sm text-white/55">제품 촬영본 준비 중 · 4:5 비율</p>
          )}
        </div>
      </div>

      {photos.length > 1 && (
        <ul className="flex gap-2" aria-label="메인 사진 고르기">
          {photos.map((p, i) => (
            <li key={p.url}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}번째 사진 보기`}
                aria-current={i === index ? "true" : undefined}
                className={`ease-fluid block aspect-[4/5] w-16 overflow-hidden rounded-xl border-2 transition-colors duration-300 md:w-20 ${
                  i === index ? "border-accent" : "hover:border-accent/50 border-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
