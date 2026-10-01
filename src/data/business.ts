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

// 2026-10-01 고객 전달값. 사업자등록번호만 표기 형식(000-00-00000)으로 끊었고 나머지는 받은 그대로다.
// TODO(고객확인) 개인정보 보호책임자 · 주소를 사업자등록증과 대조(시·도 표기 포함 여부)
export const BUSINESS: BusinessInfo = {
  companyName: "레오네페리토 (LEONEFERITO)",
  representative: "조강현",
  registrationNumber: "881-15-02245",
  mailOrderNumber: "2024-수원영통-0059",
  address: "수원시 영통구 매영로 425번길 1 1층 더맨리",
  phone: "010-2434-7794 · 010-9291-0518",
  email: "sport0308@naver.com",
  privacyOfficer: null,
  // 서버를 정한 뒤 채운다 (FE 는 Vercel, API 는 미정).
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
