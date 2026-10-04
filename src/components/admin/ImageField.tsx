"use client";

import { Warning } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useId, useRef, useState } from "react";

import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  checkImageFile,
  formatBytes,
  uploadImage,
  type UploadedImage,
} from "@/lib/admin";

/**
 * 이미지 한 칸 — 고르기 · 미리보기 · 올리기 · 지우기.
 *
 * 이미지를 받는 모든 화면(상품 · 배너 · 룩북)이 이 하나를 쓴다. 화면마다 따로 짜면
 * 용량 한도나 형식 검사가 한쪽에만 걸리는 날이 온다.
 *
 * ── 미리보기를 **올리기 전에** 보여준다 ──────────────────
 * 파일을 고른 즉시 `URL.createObjectURL` 로 그린다. 업로드가 끝날 때까지 기다리면
 * 10MB 짜리를 올리는 몇 초 동안 화면이 비어 있어서, 관리자는 잘못 골랐는지
 * 멈춘 건지 알 수 없다. 고른 순간 보이면 틀린 파일을 바로 알아챈다.
 *
 * 만든 URL 은 반드시 해제한다. 안 그러면 파일 바이트가 탭이 닫힐 때까지 메모리에 남는다.
 *
 * ── 용량 · 형식은 두 겹이다 ──────────────────────────────
 * 여기서 먼저 걸러 주는 건 **편의**다 — 10MB 를 다 올리고 나서 거부당하지 않게.
 * 진짜 방어는 서버가 한다(매직바이트 판별). 화면 검사는 우회할 수 있다.
 *
 * ── 비율을 고정한다 ─────────────────────────────────────
 * 미리보기 칸의 크기를 미리 잡아 둔다. 이미지가 도착하면서 칸이 커지면
 * 그 아래 폼 전체가 아래로 밀린다(레이아웃 이동). 누르려던 버튼이 도망간다.
 */

export interface ImageFieldValue {
  mediaId: string;
  url: string;
  filename: string;
}

interface Props {
  label: string;
  /** 이 칸이 무엇에 쓰이는지 한 줄. "대표 이미지" 만으로는 어디에 나오는지 모른다. */
  hint?: string;
  value: ImageFieldValue | null;
  onChange: (next: ImageFieldValue | null) => void;
  /** 미리보기 칸 비율. 실제로 놓일 자리와 같게 준다. */
  aspect?: "portrait" | "square" | "wide";
  required?: boolean;
}

const ASPECT_CLASS = {
  portrait: "aspect-[3/4]",
  square: "aspect-square",
  wide: "aspect-[16/9]",
} as const;

export function ImageField({
  label,
  hint,
  value,
  onChange,
  aspect = "portrait",
  required = false,
}: Props) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  /** 올리는 동안 보여줄 로컬 미리보기. 업로드가 끝나면 서버 url 로 바뀐다. */
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // 컴포넌트가 사라질 때 남은 objectURL 을 정리한다.
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    const problem = checkImageFile(file);
    if (problem) {
      setError(problem);
      // 같은 파일을 다시 고를 수 있게 값을 비운다. 안 그러면 onChange 가 안 걸린다.
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const preview = URL.createObjectURL(file);
    setLocalPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return preview;
    });

    setPending(true);
    try {
      const uploaded: UploadedImage = await uploadImage(file);
      onChange({
        mediaId: uploaded.id,
        url: uploaded.url,
        filename: uploaded.filename,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "올리지 못했습니다.");
      // 실패했으면 미리보기도 걷는다 — 올라간 것처럼 보이면 안 된다.
      setLocalPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove() {
    setLocalPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setError(null);
    onChange(null);
  }

  const shownUrl = value?.url ?? localPreview;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-secondary text-2xs">
          {label}
          {required && (
            <span className="text-accent ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {/*
          줄바꿈을 막지 않는다. 받는 형식이 늘면서(GIF · AVIF · BMP) 이 문구가 길어졌고,
          nowrap 이면 320px 화면에서 줄을 못 바꿔 **페이지 전체에 가로 스크롤이 생긴다**
          (QA 에서 33px 넘침으로 잡혔다). 폭이 남으면 지금처럼 라벨 옆 한 줄로 서고,
          좁으면 오른쪽 정렬로 접힌다.
        */}
        <span className="text-muted text-2xs text-right">
          JPG · PNG · WebP · GIF · AVIF · BMP · 최대 {formatBytes(MAX_IMAGE_BYTES)}
        </span>
      </div>

      {hint && <p className="text-muted text-2xs leading-relaxed">{hint}</p>}

      <div className="flex items-start gap-3">
        {/* 미리보기 칸. 비율을 고정해 두어 이미지가 와도 아래가 밀리지 않는다. */}
        <div
          className={`border-subtle bg-band/60 relative w-24 shrink-0 overflow-hidden rounded-xl border ${ASPECT_CLASS[aspect]}`}
        >
          {shownUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={shownUrl}
              alt=""
              // 관리자 화면의 미리보기는 장식이다. 무엇인지는 옆의 파일명이 말한다.
              aria-hidden="true"
              className={`h-full w-full object-cover transition-opacity duration-300 ${
                pending ? "opacity-50" : "opacity-100"
              }`}
            />
          ) : (
            <span className="text-muted text-2xs absolute inset-0 flex items-center justify-center">
              없음
            </span>
          )}

          {pending && (
            <span className="bg-base/60 text-primary text-2xs absolute inset-0 flex items-center justify-center">
              올리는 중
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-col items-start gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            onChange={(e) => handleFile(e.target.files?.[0])}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            disabled={pending}
            /*
              기본 파일 입력은 브라우저마다 생김새가 다르고 한국어 라벨도 제각각이다.
              화면 밖으로 치우지 않고 sr-only 로 둔다 — 키보드 초점은 그대로 받아야 한다.
            */
            className="sr-only"
          />

          <label
            htmlFor={inputId}
            className="border-interactive text-accent hover:border-accent hover:bg-accent-tint ease-fluid text-2xs inline-flex min-h-11 cursor-pointer items-center rounded-full border px-5 transition-all duration-300"
          >
            {shownUrl ? "다른 이미지" : "이미지 선택"}
          </label>

          {value && (
            <>
              <p className="text-muted text-2xs max-w-[22ch] truncate">
                {value.filename}
              </p>
              <button
                type="button"
                onClick={remove}
                className="text-muted hover:text-error ease-fluid text-2xs inline-flex min-h-11 items-center underline underline-offset-4 transition-colors duration-300"
              >
                제거
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p
          id={errorId}
          className="text-error text-2xs flex gap-1.5 leading-relaxed"
        >
          {/* 색만으로 알리지 않는다 */}
          <Warning
            size={13}
            weight="light"
            aria-hidden="true"
            className="mt-px shrink-0"
          />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
