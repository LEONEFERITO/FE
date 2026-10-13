"use client";

import { Warning } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useId, useRef, useState } from "react";

import type { ImageFieldValue } from "@/components/admin/ImageField";
import {
  ACCEPTED_VIDEO_TYPES,
  MAX_VIDEO_BYTES,
  VIDEO_RECOMMENDED_BYTES,
  checkVideoFile,
  formatBytes,
  uploadImage,
  uploadVideo,
} from "@/lib/admin";

/**
 * 영상 한 칸 — 메인 배너 "영상으로 등록" (2026-10-13, 서버 V29). ImageField 와 같은 규칙(고른 즉시 미리보기 · 두 겹 검사 ·
 * 비율 고정)에 둘을 더했다:
 *
 * ── 첫 장면 사진을 자동으로 만든다 ───────────────────────
 * 영상은 받는 데 몇 초 걸린다. 그동안 손님 화면이 비지 않게 영상의 첫 장면을 사진(JPG)으로 잘라 함께 올린다(poster).
 * 고른 파일(내 컴퓨터의 것)에서 자르므로 서버에 올리기 전에 끝난다. 못 자르면(코덱을 브라우저가 못 읽는 등)
 * 사진 없이 영상만 올라간다 — 손님 화면은 영상이 올 때까지 어두운 바탕이다.
 *
 * ── 올라가는 정도를 보여 준다 ───────────────────────────
 * 수십 MB 라 오래 걸릴 수 있다. 멈춘 건지 올라가는 중인지 알 수 있게 % 를 보인다(lib/admin uploadVideo).
 */

export interface VideoFieldValue {
  video: ImageFieldValue;
  /** 첫 장면 사진. 못 만들었으면 null */
  poster: ImageFieldValue | null;
}

interface Props {
  label: string;
  hint?: string;
  value: VideoFieldValue | null;
  onChange: (next: VideoFieldValue | null) => void;
  aspect?: "portrait" | "wide";
  required?: boolean;
}

const ASPECT_CLASS = { portrait: "aspect-[9/16]", wide: "aspect-[16/9]" } as const;
const PREVIEW_WIDTH = { portrait: "w-20", wide: "w-36" } as const;

/** 고른 영상의 첫 장면을 JPG 로. 긴 변 1920px 까지. 못 하면 null (8초 안에 안 되면 포기) */
async function captureFirstFrame(file: File): Promise<File | null> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  const work = (async () => {
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("decode"));
      video.src = url;
    });
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      video.currentTime = Math.min(0.1, (video.duration || 1) / 2);
    });
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;
    const scale = Math.min(1, 1920 / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ? new File([blob], `${file.name.replace(/\.[^.]+$/, "")}-poster.jpg`, { type: "image/jpeg" }) : null;
  })();
  const timeout = new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 8000));
  try {
    return await Promise.race([work, timeout]);
  } catch {
    return null;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

export function VideoField({ label, hint, value, onChange, aspect = "wide", required = false }: Props) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  /** 올리는 중이면 0~1, 아니면 null */
  const [progress, setProgress] = useState<number | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const clearLocal = () =>
    setLocalPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setNote(null);
    const problem = checkVideoFile(file);
    if (problem) {
      setError(problem);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const preview = URL.createObjectURL(file);
    setLocalPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return preview;
    });

    setProgress(0);
    try {
      const frame = await captureFirstFrame(file);
      const video = await uploadVideo(file, (r) => setProgress(r));
      let poster: ImageFieldValue | null = null;
      if (frame) {
        try {
          const up = await uploadImage(frame);
          poster = { mediaId: up.id, url: up.url, filename: up.filename };
        } catch {
          poster = null;
        }
      }
      onChange({ video: { mediaId: video.id, url: video.url, filename: video.filename }, poster });
      const notes = [
        file.size > VIDEO_RECOMMENDED_BYTES
          ? `용량이 큽니다(${formatBytes(file.size)}). 손님 화면에서 영상이 늦게 나올 수 있어요 — ${formatBytes(VIDEO_RECOMMENDED_BYTES)} 안팎을 권합니다.`
          : null,
        poster ? null : "첫 장면 사진을 만들지 못했습니다. 영상이 나올 때까지 어두운 바탕이 보입니다.",
      ].filter(Boolean);
      setNote(notes.length ? notes.join(" ") : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "올리지 못했습니다.");
      clearLocal();
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove() {
    clearLocal();
    setError(null);
    setNote(null);
    onChange(null);
  }

  const pending = progress !== null;
  const shownUrl = value?.video.url ?? localPreview;

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
        <span className="text-muted text-2xs text-right">MP4 · WebM · 최대 {formatBytes(MAX_VIDEO_BYTES)}</span>
      </div>

      {hint && <p className="text-muted text-2xs leading-relaxed">{hint}</p>}

      <div className="flex items-start gap-3">
        <div
          className={`border-subtle bg-band/60 relative shrink-0 overflow-hidden rounded-xl border ${PREVIEW_WIDTH[aspect]} ${ASPECT_CLASS[aspect]}`}
        >
          {shownUrl ? (
            <video
              key={shownUrl}
              src={shownUrl}
              poster={value?.poster?.url}
              muted
              loop
              autoPlay
              playsInline
              aria-hidden="true"
              className={`h-full w-full object-cover transition-opacity duration-300 ${pending ? "opacity-50" : "opacity-100"}`}
            />
          ) : (
            <span className="text-muted text-2xs absolute inset-0 flex items-center justify-center">없음</span>
          )}
          {pending && (
            <span className="bg-base/60 text-primary text-2xs absolute inset-0 flex items-center justify-center tabular-nums">
              {progress > 0 ? `${Math.round(progress * 100)}%` : "준비 중"}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-col items-start gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPTED_VIDEO_TYPES.join(",")}
            onChange={(e) => handleFile(e.target.files?.[0])}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            disabled={pending}
            className="sr-only"
          />
          <label
            htmlFor={inputId}
            className="border-interactive text-accent hover:border-accent hover:bg-accent-tint ease-fluid text-2xs inline-flex min-h-11 cursor-pointer items-center rounded-full border px-5 transition-all duration-300"
          >
            {pending ? "올리는 중" : shownUrl ? "다른 영상" : "영상 선택"}
          </label>
          {pending && (
            <p className="text-muted text-2xs" aria-live="polite">
              영상을 올리는 중입니다{progress > 0 ? ` (${Math.round(progress * 100)}%)` : ""}. 창을 닫지 마세요.
            </p>
          )}
          {value && !pending && (
            <>
              {value.video.filename && <p className="text-muted text-2xs max-w-[22ch] truncate">{value.video.filename}</p>}
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

      {note && <p className="text-secondary text-2xs leading-relaxed">{note}</p>}
      {error && (
        <p id={errorId} className="text-error text-2xs flex gap-1.5 leading-relaxed">
          <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
