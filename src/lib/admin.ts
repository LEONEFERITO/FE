/**
 * 관리자 API 경계면.
 *
 * 공개 화면용 `lib/auth.ts` 와 같은 규칙을 따른다 — 쿠키 인증, CSRF 토큰, 서버가 진짜 기준.
 *
 * ── 여기 있는 상한값은 **사본**이다 ───────────────────────
 * 진짜 기준은 서버(`AdminProductRequests`)다. 화면에서만 막으면 API 를 직접 호출하는
 * 순간 뚫리고, 서버에서만 막으면 관리자가 다 쓰고 나서야 거부당한다.
 * 그래서 같은 숫자를 양쪽에 두되, **여기 값이 서버 값을 넘으면 안 된다.**
 * 서버가 바꾸면 여기도 같이 고친다.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export const ADMIN_CONNECTED = API_BASE.length > 0;

/** 글자 수 상한. 각 값이 "그 글자가 실제로 놓이는 자리" 에서 나왔다. */
export const LIMITS = {
  /** 카드에서 두 줄로 잘린다. 그 두 줄에 들어갈 만큼. */
  name: 40,
  /** 목록 카드 아래 한 줄. */
  summary: 60,
  /** 상세 페이지 한 덩어리. */
  body: 2000,
  /** 원단·관리 정보. 표 아래 문단. */
  shortBody: 500,
  /** 대체 텍스트. 한 문장이면 충분하다. */
  alt: 120,
  /**
   * 사이즈 차트 대체 텍스트.
   *
   * 일반 사진보다 길게 잡는다. 표를 이미지로 만든 이상 이 문장이 **스크린리더에게는
   * 유일한 정보원**이라, "사이즈 차트" 한 마디로는 아무것도 전달되지 않는다.
   * 최소한 어떤 항목을 어느 사이즈 범위로 싣고 있는지는 적어야 한다.
   */
  sizeChartAlt: 300,
  slug: 80,
  /** 인스타그램 게시물 주소. 실제로는 60자 안팎. */
  instagramUrl: 300,
} as const;

/**
 * 인스타그램 주소 규칙. 서버(`AdminProductRequests.Save.instagramUrl`)와 **같은 식**이다.
 * 손님이 누르는 링크라 instagram.com 만 받는다 — 특히 `javascript:` 가 href 에 들어가면
 * 누르는 순간 스크립트가 실행된다. 진짜 방어는 서버이고, 여기는 저장 전에 알려주는 용도다.
 */
export const INSTAGRAM_URL_RE = /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._~/?=&%+-]*$/;

/**
 * 이미지 한 장 최대 크기.
 *
 * ⚠️ 서버의 `MediaService.MAX_BYTES` · `spring.servlet.multipart.max-file-size` 와
 * **같은 값**이어야 한다. 셋 중 하나만 바뀌면 화면은 통과시키는데 서버가 거부하거나,
 * 그 반대가 된다.
 */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** 받아주는 형식. 서버는 매직바이트로 다시 확인하므로 여기 값은 편의일 뿐이다. */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/**
 * 고르자마자 하는 검사.
 *
 * <p>서버까지 다녀오고 나서 "너무 큽니다" 를 듣게 하면, 10MB 를 다 올린 뒤에 버려진다.
 * 여기서 먼저 걸러 주면 즉시 알 수 있다. 물론 <b>이건 편의일 뿐이고</b>
 * 실제 방어는 서버가 한다 — 화면 검사는 우회할 수 있다.
 */
export function checkImageFile(file: File): string | null {
  if (file.size > MAX_IMAGE_BYTES) {
    return `이미지가 너무 큽니다 (${formatBytes(file.size)}). ${formatBytes(MAX_IMAGE_BYTES)} 이하로 올려 주세요.`;
  }
  if (file.size === 0) {
    return "빈 파일입니다.";
  }
  /*
   * type 은 브라우저가 확장자로 추측한 값이라 믿을 수 없다. 그래도 걸러 두면
   * 실수로 PDF 를 고른 경우를 바로 알려줄 수 있다. 위장 파일은 서버가 잡는다.
   */
  if (file.type && !ACCEPTED_IMAGE_TYPES.includes(file.type as never)) {
    return "JPG · PNG · WebP 이미지만 올릴 수 있습니다.";
  }
  return null;
}

export class AdminApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

async function csrfHeader(): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE}/api/auth/csrf`, { credentials: "include" });
  if (!res.ok) throw new AdminApiError("NETWORK", "연결에 실패했습니다.");
  const body: { headerName: string; token: string } = await res.json();
  return { [body.headerName]: body.token };
}

async function fail(res: Response): Promise<never> {
  let code = "UNKNOWN";
  let message = "처리하지 못했습니다.";
  try {
    const body = await res.json();
    code = body.code ?? code;
    // 관리자 화면은 서버 문구를 그대로 보여준다 — 신뢰 경계 안이고, 고칠 사람이 본다.
    message = body.message ?? message;
  } catch {
    // 본문이 없을 수 있다(413 등). 상태 코드로 최소한의 안내를 만든다.
    if (res.status === 413) message = "이미지가 너무 큽니다.";
    if (res.status === 401) message = "로그인이 필요합니다.";
    if (res.status === 403) message = "권한이 없습니다.";
  }
  throw new AdminApiError(code, message);
}

export interface UploadedImage {
  id: string;
  url: string;
  filename: string;
  byteSize: number;
  width: number | null;
  height: number | null;
}

/** 이미지 업로드. 성공하면 바로 화면에 걸 수 있는 url 이 함께 온다. */
export async function uploadImage(file: File): Promise<UploadedImage> {
  if (!ADMIN_CONNECTED) {
    throw new AdminApiError("NOT_CONNECTED", "서버가 아직 연결되지 않았습니다.");
  }

  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/api/admin/media`, {
    method: "POST",
    credentials: "include",
    // Content-Type 을 직접 넣지 않는다. FormData 는 경계 문자열이 필요한데
    // 그건 브라우저만 만들 수 있다. 직접 넣으면 서버가 본문을 파싱하지 못한다.
    headers: await csrfHeader(),
    body: form,
  });

  if (!res.ok) return fail(res);
  return (await res.json()) as UploadedImage;
}

export interface ProductDraft {
  slug: string;
  name: string;
  category: string;
  line: string;
  priceKrw: number | null;
  listPriceKrw: number | null;
  summary: string;
  description: string;
  intent: string;
  features: string;
  fabric: string;
  care: string;
  modelHeightCm: number | null;
  modelWeightKg: number | null;
  modelSize: string;
  leadTimeDays: number | null;
  /** 노출 순서. 폼에 칸이 없어도 수정 때는 원래 값을 그대로 돌려보낸다. */
  displayOrder?: number;
  images: { mediaId: string; kind: string; alt: string; sortOrder?: number }[];
  skus: {
    size: string;
    orderable: boolean;
    sortOrder?: number;
    measurements?: { part: string; valueCm: number; toleranceCm: number | null }[];
  }[];
  /**
   * 상세 사이즈 차트 이미지.
   *
   * 상품 사진(images)과 따로 두는 이유: 갤러리에 섞이면 안 된다.
   * 손님이 사진을 넘기다가 표가 나오면 상품 컷으로 오해한다. 놓이는 자리가 다르다.
   */
  sizeChartMediaId: string | null;
  sizeChartAlt: string;
  /** 인스타그램 게시물. 빈 칸이면 null 로 나간다(blankToNull) — 상세에서 버튼이 숨는다. */
  instagramUrl: string;
}

/**
 * 빈 문자열을 null 로 바꾼다.
 *
 * 서버에서 "" 와 null 은 다른 값이다 — 전자는 "비우기로 정했다", 후자는 "아직 안 정했다".
 * 화면의 빈 칸은 후자이므로 null 로 보낸다. "" 로 보내면 미확정 상품이
 * "이름을 빈 문자열로 정한 상품" 이 되어 공개 조건 검사를 통과해 버린다.
 */
function blankToNull(draft: ProductDraft): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(draft)) {
    out[k] = typeof v === "string" && v.trim() === "" ? null : v;
  }
  return out;
}

export async function createProduct(draft: ProductDraft): Promise<string> {
  if (!ADMIN_CONNECTED) {
    throw new AdminApiError("NOT_CONNECTED", "서버가 아직 연결되지 않았습니다.");
  }

  const res = await fetch(`${API_BASE}/api/admin/products`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(await csrfHeader()) },
    body: JSON.stringify(blankToNull(draft)),
  });

  if (!res.ok) return fail(res);
  const body: { id: string } = await res.json();
  return body.id;
}

/**
 * 수정 저장. 폼이 보낸 것이 "현재 상태 전체" 다 — 서버는 이미지·사이즈를 통째로 교체한다.
 * 그래서 폼이 다루지 않는 값(실측·모델 정보 등)도 반드시 함께 보내야 한다.
 * 빼면 저장할 때마다 지워진다. 그 책임은 `ProductForm` 이 진다.
 */
export async function updateProduct(id: string, draft: ProductDraft): Promise<void> {
  if (!ADMIN_CONNECTED) {
    throw new AdminApiError("NOT_CONNECTED", "서버가 아직 연결되지 않았습니다.");
  }

  const res = await fetch(`${API_BASE}/api/admin/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(await csrfHeader()) },
    body: JSON.stringify(blankToNull(draft)),
  });
  if (!res.ok) return fail(res);
}

export async function publishProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/products/${encodeURIComponent(id)}/publish`, {
    method: "POST",
    credentials: "include",
    headers: await csrfHeader(),
  });
  if (!res.ok) return fail(res);
}

export async function unpublishProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/products/${encodeURIComponent(id)}/unpublish`, {
    method: "POST",
    credentials: "include",
    headers: await csrfHeader(),
  });
  if (!res.ok) return fail(res);
}

// ── 조회 ─────────────────────────────────────────────────────

export type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export const STATUS_LABEL: Record<ProductStatus, string> = {
  DRAFT: "초안",
  PUBLISHED: "공개",
  ARCHIVED: "보관",
};

/**
 * 공개에 모자란 항목의 이름.
 *
 * 서버가 주는 값(`Product.missingForPublish`)은 필드 키다. 관리자가 읽는 말로 바꾼다.
 * 모르는 키가 오면 키를 그대로 보여준다 — 서버가 조건을 늘렸는데 화면이 숨기면
 * "왜 공개가 안 되지?" 로 돌아간다.
 */
export const MISSING_LABEL: Record<string, string> = {
  name: "상품명",
  priceKrw: "판매가",
  leadTimeDays: "제작 기간",
  mainImage: "대표 이미지",
};

export function missingLabel(key: string): string {
  return MISSING_LABEL[key] ?? key;
}

export interface AdminProductRow {
  id: string;
  slug: string;
  name: string | null;
  category: string;
  line: string;
  status: ProductStatus;
  priceKrw: number | null;
  mainImageUrl: string | null;
  missingForPublish: string[];
  updatedAt: string;
}

/** 수정 화면. 서버의 저장 요청과 같은 모양 + 읽기 전용 값. */
export interface AdminProductEdit {
  id: string;
  status: ProductStatus;
  missingForPublish: string[];
  slug: string;
  name: string | null;
  category: string;
  line: string;
  priceKrw: number | null;
  listPriceKrw: number | null;
  summary: string | null;
  description: string | null;
  intent: string | null;
  features: string | null;
  fabric: string | null;
  care: string | null;
  modelHeightCm: number | null;
  modelWeightKg: number | null;
  modelSize: string | null;
  leadTimeDays: number | null;
  displayOrder: number;
  sizeChartMediaId: string | null;
  sizeChartUrl: string | null;
  sizeChartAlt: string | null;
  instagramUrl: string | null;
  images: { mediaId: string; url: string; kind: string; alt: string; sortOrder: number }[];
  skus: {
    size: string;
    sortOrder: number;
    orderable: boolean;
    measurements: { part: string; valueCm: number; toleranceCm: number | null }[];
  }[];
}

async function getJson<T>(path: string): Promise<T> {
  if (!ADMIN_CONNECTED) {
    throw new AdminApiError("NOT_CONNECTED", "서버가 아직 연결되지 않았습니다.");
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  } catch {
    // 서버가 꺼져 있으면 fetch 자체가 던진다. 응답이 없으니 fail() 로 갈 수 없다.
    throw new AdminApiError("NETWORK", "서버에 연결하지 못했습니다.");
  }
  if (!res.ok) return fail(res);
  return (await res.json()) as T;
}

/** 전체 목록. 초안 포함. 상태별로 거르는 건 화면이 한다 — 수십 점이라 요청 한 번이면 된다. */
export function listProducts(): Promise<AdminProductRow[]> {
  return getJson("/api/admin/products");
}

export function getProduct(id: string): Promise<AdminProductEdit> {
  return getJson(`/api/admin/products/${encodeURIComponent(id)}`);
}
