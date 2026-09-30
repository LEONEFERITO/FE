/**
 * 사업자 정보 — 푸터와 약관이 같은 값을 쓴다.
 *
 * 전자상거래법 제10조: 상호 · 대표자 · 주소 · 전화 · 이메일 · 사업자등록번호 ·
 * 통신판매업 신고번호 · 이용약관 · 호스트서버 소재지를 **첫 화면에** 표시해야 한다.
 * 개인정보 보호법 제30조: 개인정보처리방침을 공개해야 한다 (링크는 푸터가 건다).
 *
 * 확인 전까지 null 로 둔다 — 추측으로 채우면 틀린 법적 표기가 공개된다.
 * 필요한 값은 docs/CLIENT_QUESTIONS.md F-1 에 정리되어 있다.
 *
 * PG 심사에서 **사업자등록증과 한 글자라도 다르면** 반려된다. 받은 그대로 옮긴다.
 */

export interface BusinessInfo {
  /** 상호 (사업자등록증 그대로) */
  companyName: string | null;
  representative: string | null;
  /** 000-00-00000 */
  registrationNumber: string | null;
  /** 예) 제2026-서울강남-0000호 */
  mailOrderNumber: string | null;
  /** 반품 받는 주소가 다르면 그 주소도 함께 적는다 (소비자 불만 처리 주소) */
  address: string | null;
  phone: string | null;
  email: string | null;
  privacyOfficer: string | null;
  /** 호스트서버 소재지. 서버를 정한 뒤 우리가 채운다 (예: "Amazon Web Services (서울)") */
  hosting: string | null;
}

// TODO(고객확인) F-1 사업자 정보 — 사업자등록증 · 통신판매업 신고증 사본으로 받는다.
export const BUSINESS: BusinessInfo = {
  companyName: null,
  representative: null,
  registrationNumber: null,
  mailOrderNumber: null,
  address: null,
  phone: null,
  email: null,
  privacyOfficer: null,
  hosting: null,
};

/** 푸터에 표시하는 순서. */
export const BUSINESS_FIELDS: { key: keyof BusinessInfo; label: string }[] = [
  { key: "companyName", label: "상호" },
  { key: "representative", label: "대표자" },
  { key: "registrationNumber", label: "사업자등록번호" },
  { key: "mailOrderNumber", label: "통신판매업 신고번호" },
  { key: "address", label: "사업장 주소" },
  { key: "phone", label: "대표 전화" },
  { key: "email", label: "이메일" },
  { key: "privacyOfficer", label: "개인정보 보호책임자" },
  { key: "hosting", label: "호스팅 서비스 제공자" },
];
