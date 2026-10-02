"use client";

import { ArrowDown, ArrowUp, Plus, Warning, X } from "@phosphor-icons/react/dist/ssr";
import { useId, useState } from "react";

import { AdminApiError, MAX_IMAGE_BYTES, ACCEPTED_IMAGE_TYPES, checkImageFile, formatBytes, uploadImage } from "@/lib/admin";

/**
 * 상세 이미지 — 한국 쇼핑몰식 긴 상세페이지 이미지를 여러 장.
 *
 * 손님 화면에서는 **이 순서대로 간격 없이** 이어 붙는다. 그래서 한 장으로 만든 긴 상세페이지를
 * 잘라서 올려도(용량 때문에 보통 그렇게 한다) 이음매 없이 이어진다. 오른쪽 "이어 붙인 모습" 으로
 * 저장 전에 확인한다.
 *
 * 설명(대체 텍스트)은 장마다 받는다. 상세 이미지에는 글자가 많이 들어가는데, 이미지 속 글자는
 * 스크린리더가 읽지 못한다 — 그 장의 핵심 문구를 적어 두면 그 손님도 읽을 수 있다.
 */

export interface StoryImage {
  mediaId: string;
  url: string;
  alt: string;
}

export const STORY_MAX = 30;

export function StoryImagesField({
  value,
  onChange,
  productName,
}: {
  value: StoryImage[];
  onChange: (next: StoryImage[]) => void;
  productName: string;
}) {
  const inputId = useId();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function add(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const room = STORY_MAX - value.length;
    const picked = Array.from(files).slice(0, Math.max(room, 0));
    if (files.length > room) setError(`상세 이미지는 ${STORY_MAX}장까지 올릴 수 있습니다.`);
    let next = [...value];
    for (let k = 0; k < picked.length; k++) {
      const file = picked[k];
      const problem = checkImageFile(file);
      if (problem) {
        setError(`${file.name}: ${problem}`);
        break;
      }
      setBusy(`${k + 1} / ${picked.length} 올리는 중`);
      try {
        const up = await uploadImage(file);
        next = [...next, { mediaId: up.id, url: up.url, alt: `${productName.trim() || "상품"} 상세 이미지 ${next.length + 1}` }];
        onChange(next);
      } catch (e) {
        setError(e instanceof AdminApiError ? e.message : `${file.name} 을(를) 올리지 못했습니다.`);
        break;
      }
    }
    setBusy(null);
  }

  function move(i: number, d: number) {
    const to = i + d;
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    [next[i], next[to]] = [next[to], next[i]];
    onChange(next);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
      <div className="flex min-w-0 flex-col gap-4">
        <p className="text-muted text-2xs leading-relaxed">
          위에서부터 이 순서대로 <b className="text-secondary">간격 없이</b> 이어 붙습니다. 가로 860px 로 만든 상세페이지를
          그대로 올리면 됩니다 — 한 장이 너무 길거나 무거우면 여러 장으로 잘라 올려도 이음매가 보이지 않습니다.
          {" "}JPG · PNG · WebP · GIF · AVIF · BMP · 한 장 {formatBytes(MAX_IMAGE_BYTES)} · 최대 {STORY_MAX}장.
        </p>

        {value.length > 0 && (
          <ol className="border-subtle divide-subtle divide-y border-y">
            {value.map((img, i) => (
              <li key={img.mediaId} className="flex items-start gap-3 py-3">
                <span className="text-muted text-2xs w-5 shrink-0 pt-3 text-right tabular-nums">{i + 1}</span>
                <div className="bg-band h-24 w-16 shrink-0 overflow-hidden rounded-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" aria-hidden="true" className="h-full w-full object-cover object-top" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <label htmlFor={`${inputId}-alt-${i}`} className="text-secondary text-2xs">
                    이 장의 핵심 문구 (대체 텍스트)
                  </label>
                  <input
                    id={`${inputId}-alt-${i}`}
                    value={img.alt}
                    maxLength={120}
                    onChange={(e) => onChange(value.map((v, k) => (k === i ? { ...v, alt: e.target.value } : v)))}
                    className="border-interactive focus-visible:border-accent text-primary min-h-11 rounded-xl border bg-transparent px-3 text-sm"
                  />
                </div>
                <div className="flex shrink-0 flex-col">
                  <button type="button" aria-label={`${i + 1}번 위로`} disabled={i === 0} onClick={() => move(i, -1)}
                    className="text-secondary hover:text-accent inline-flex h-11 w-11 items-center justify-center disabled:opacity-30">
                    <ArrowUp size={15} weight="light" aria-hidden="true" />
                  </button>
                  <button type="button" aria-label={`${i + 1}번 아래로`} disabled={i === value.length - 1} onClick={() => move(i, 1)}
                    className="text-secondary hover:text-accent inline-flex h-11 w-11 items-center justify-center disabled:opacity-30">
                    <ArrowDown size={15} weight="light" aria-hidden="true" />
                  </button>
                </div>
                <button type="button" aria-label={`${i + 1}번 빼기`} onClick={() => onChange(value.filter((_, k) => k !== i))}
                  className="text-muted hover:text-error inline-flex h-11 w-11 shrink-0 items-center justify-center">
                  <X size={15} weight="light" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
        )}

        {value.length < STORY_MAX && (
          <label className={`border-interactive text-primary hover:border-accent ease-fluid inline-flex min-h-12 w-fit items-center gap-2 rounded-full border px-6 text-sm transition-colors duration-300 ${busy ? "cursor-wait opacity-60" : "cursor-pointer"}`}>
            <Plus size={15} weight="light" aria-hidden="true" />
            {busy ?? (value.length === 0 ? "상세 이미지 올리기 (여러 장 선택 가능)" : "더 올리기")}
            <input type="file" multiple accept={ACCEPTED_IMAGE_TYPES.join(",")} disabled={busy !== null} className="sr-only"
              onChange={(e) => {
                add(e.target.files);
                e.target.value = "";
              }} />
          </label>
        )}
        {error && (
          <p role="alert" className="text-error text-2xs flex gap-1.5 leading-relaxed">
            <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-muted text-2xs">이어 붙인 모습 (손님 화면과 같은 순서)</p>
        <div className="border-subtle bg-band/60 mt-2 max-h-[560px] overflow-y-auto rounded-xl border">
          {value.length === 0 ? (
            <p className="text-muted px-4 py-10 text-center text-2xs">아직 없습니다</p>
          ) : (
            <div className="flex flex-col">
              {value.map((img) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={img.mediaId} src={img.url} alt="" aria-hidden="true" className="block h-auto w-full" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
