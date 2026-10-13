/**
 * 올리기 전에 사진을 줄인다 (2026-10-13 "원본 사진을 그냥 올려도 되게").
 *
 * 촬영 원본은 장당 10~25MB · 4000~6500px 이다 — 서버 한도(10MB)를 넘고, 넘지 않아도 손님 화면에는 너무 무겁다.
 * 화면에 필요한 건 긴 변 2400px 정도(상세에서 확대해도 충분)라, 브라우저에서 그 크기로 줄여 보낸다.
 *
 *   · 이미 작은 사진(긴 변 2400px 이하 · 3MB 이하)은 손대지 않는다 — 다시 압축하면 화질만 떨어진다
 *   · 투명할 수 있는 형식(PNG · WebP — 누끼샷)은 투명을 지키는 WebP 로(브라우저가 못 만들면 PNG)
 *   · 그 밖에는 JPEG 88%
 *   · 사진 방향(EXIF 회전)은 브라우저가 읽어 바로 세운다
 *   · 브라우저가 못 읽는 형식(HEIC 등)은 그대로 둔다 — 서버가 받을지 말지 정한다
 *   · GIF 는 움직임이 사라지므로 그대로 둔다
 */

const LONG_SIDE = 2400;
const KEEP_BYTES = 3 * 1024 * 1024;

export interface Prepared {
  file: File;
  /** 줄였으면 원래 용량 — 화면이 "25.3MB → 0.8MB" 를 보여 준다 */
  shrunkFrom: number | null;
}

export async function prepareImage(file: File): Promise<Prepared> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return { file, shrunkFrom: null };
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return { file, shrunkFrom: null };
  }
  try {
    const long = Math.max(bitmap.width, bitmap.height);
    if (long <= LONG_SIDE && file.size <= KEEP_BYTES) return { file, shrunkFrom: null };
    const scale = Math.min(1, LONG_SIDE / long);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return { file, shrunkFrom: null };
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const mayBeTransparent = file.type === "image/png" || file.type === "image/webp";
    const toBlob = (type: string, quality?: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    const blob = mayBeTransparent ? await toBlob("image/webp", 0.9) : await toBlob("image/jpeg", 0.88);
    // WebP 를 못 만드는 브라우저는 PNG 를 돌려준다 — 그대로 쓴다
    if (!blob) return { file, shrunkFrom: null };
    if (blob.size >= file.size) return { file, shrunkFrom: null };
    const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
    const name = `${file.name.replace(/\.[^.]+$/, "")}.${ext}`;
    return { file: new File([blob], name, { type: blob.type }), shrunkFrom: file.size };
  } finally {
    bitmap.close();
  }
}
