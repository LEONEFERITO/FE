"use client";

import { Image as ImageIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

import { isHeic } from "@/lib/shop";

/**
 * 교환·반품 사진 한 장. 누르면 원본이 새 탭에서 열린다.
 *
 * HEIC(아이폰 원본)는 크롬 · 엣지가 그리지 못한다(사파리는 그린다). 그리지 못하면 깨진 그림 대신
 * "HEIC 사진 · 원본 받기" 칸을 보인다 — 사진은 서버에 그대로 있으니 받아서 열면 된다.
 */
export function PhotoThumb({ url, label, size }: { url: string; label: string; size: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
      className={`border-subtle bg-band/60 flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-lg border`}>
      {broken ? (
        <span className="text-muted flex flex-col items-center gap-1 px-1 text-center text-[10px] leading-tight">
          <ImageIcon size={16} weight="light" aria-hidden="true" />
          {isHeic(url) ? "HEIC 사진 원본 받기" : "원본 보기"}
        </span>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={url} alt="" onError={() => setBroken(true)} className="h-full w-full object-cover" />
      )}
    </a>
  );
}
