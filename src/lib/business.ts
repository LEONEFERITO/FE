import { BUSINESS, type BusinessInfo } from "@/data/business";

/**
 * 푸터 사업자 정보 — **빌드할 때** 서버에서 받는다 (lib/why.ts 와 같은 규칙, 서버 site_business V31).
 *
 * 관리자 › 푸터 · 사업자 정보에서 고치면 서버가 손님 화면을 다시 만든다(FrontRebuildTrigger).
 * API 주소가 없으면(화면 확인 단계) data/business.ts 의 값, 주소가 있는데 응답하지 않으면 빌드를 실패시킨다 —
 * 조용히 옛 값으로 대신하면 관리자가 고친 법정 표기가 운영에서 사라진 채 배포된다.
 *
 * 이 파일은 서버 컴포넌트(빌드)에서만 쓴다.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
// 빌드 때 받아 오는 주소 — lib/why.ts 주석 참고
const FETCH_BASE = process.env.API_BUILD_BASE || API_BASE;

async function load(): Promise<BusinessInfo> {
  const res = await fetch(`${FETCH_BASE}/api/site-business`);
  if (!res.ok) {
    throw new Error(`사업자 정보 API 응답 실패: ${res.status}`);
  }
  const d = (await res.json()) as BusinessInfo;
  return {
    companyName: d.companyName,
    representative: d.representative,
    registrationNumber: d.registrationNumber,
    mailOrderNumber: d.mailOrderNumber,
    address: d.address,
    phone: d.phone,
    email: d.email,
    privacyOfficer: d.privacyOfficer,
    hosting: d.hosting,
  };
}

let memo: Promise<BusinessInfo> | null = null;

export function getBusiness(): Promise<BusinessInfo> {
  if (!API_BASE) return Promise.resolve(BUSINESS);
  if (process.env.NODE_ENV !== "production") return load();
  memo ??= load();
  return memo;
}
