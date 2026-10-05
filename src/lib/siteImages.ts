/**
 * 사이트 사진 칸 — **빌드할 때** 서버에서 받는다 (lib/why.ts · lib/catalog.ts 와 같은 규칙).
 *
 * 상품 사진이 아닌 사진이 놓이는 자리다. 지금은 한 칸 — 메인 OFFLINE SHOP 구간의 사진.
 * 관리자가 /admin/display/offline 에서 올리고(서버 site_image, V20), 저장하면 서버가 손님 화면을 다시 만든다.
 *
 * 칸에 사진이 없으면 null 이다 — 쓰는 쪽이 코드의 기본 사진으로 메운다.
 * API 주소가 없으면(화면 확인 단계) 전부 null, 주소가 있는데 응답하지 않으면 빌드를 실패시킨다 —
 * 조용히 기본 사진으로 대신하면 관리자가 올린 사진이 운영에서 사라진 채 배포된다.
 *
 * 이 파일은 서버 컴포넌트(빌드)에서만 쓴다.
 */

/** 서버의 SiteImageSlot 과 같은 값이어야 한다. */
export type SiteImageSlot = "OFFLINE_SHOP";

export interface SiteImage {
  url: string;
  /** 사진 설명(대체 텍스트). 빈 문자열이면 장식이다. */
  alt: string;
}

export type SiteImages = Record<SiteImageSlot, SiteImage | null>;

const EMPTY: SiteImages = { OFFLINE_SHOP: null };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

interface ApiSiteImage {
  slot: string;
  imageUrl: string | null;
  alt: string | null;
}

async function load(): Promise<SiteImages> {
  const res = await fetch(`${API_BASE}/api/site-images`);
  if (!res.ok) {
    throw new Error(`사이트 사진 API 응답 실패: ${res.status}`);
  }
  const list = (await res.json()) as ApiSiteImage[];
  const out: SiteImages = { ...EMPTY };
  for (const item of list) {
    // 이 빌드가 모르는 칸은 버린다 — 서버가 칸을 먼저 늘려도 화면은 깨지지 않는다.
    if (item.slot in out && item.imageUrl) {
      out[item.slot as SiteImageSlot] = { url: item.imageUrl, alt: item.alt ?? "" };
    }
  }
  return out;
}

let memo: Promise<SiteImages> | null = null;

export function getSiteImages(): Promise<SiteImages> {
  if (!API_BASE) return Promise.resolve(EMPTY);
  if (process.env.NODE_ENV !== "production") return load();
  memo ??= load();
  return memo;
}
