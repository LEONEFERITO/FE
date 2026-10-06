import { KAKAO_CHANNEL } from "@/data/business";
import { CATEGORY_NAV, CATEGORY_SUBS, categoryHref, subHref } from "@/data/categories";

/**
 * 사이트 메뉴 구조 — 2026-10-06 고객 사이트 구조표(브랜드웹사이트상세정보.xlsx 의 "카테고리" 시트).
 *
 * 상위 메뉴와 하위 메뉴, 설명 칸은 구조표 그대로다. 헤더(PC 드롭다운 · 모바일 펼침)와 푸터가 이 목록 하나를 본다.
 * 주소는 전부 실재하는 페이지 · 구간이다 — 없는 주소를 걸면 "곧 생긴다" 가 아니라 "고장났다" 로 읽힌다.
 *
 *   THE MAISON       브랜드 페이지의 구간들(/brand/#…)
 *   THE GUIDE        이용 안내의 구간들(/guide/#…)
 *   THE LOOKBOOK     룩북의 두 컬렉션(/lookbook/#…)
 *   분류 다섯 + ACCESSORIES  카테고리 페이지와 세부 메뉴(?sub=). ACCESSORIES 는 구조표에 없지만 남긴다(2026-10-06 결정)
 *   CLIENT SERVICES  문의(카카오톡) · 마이페이지 구간들 · FAQ
 */

export interface NavLink {
  label: string;
  href: string;
  /** 구조표의 설명 칸. 드롭다운에서 이름 아래 작게 보인다 */
  description?: string;
  /** 사이트 밖(카카오톡 등) — 새 창으로 연다 */
  external?: boolean;
}

export interface NavGroup extends NavLink {
  /** 상위 메뉴 묶음 — 드롭다운 머리에 보인다 */
  description: string;
  children: NavLink[];
}

const BRAND_GROUPS: NavGroup[] = [
  {
    label: "THE MAISON",
    href: "/brand/",
    description: "브랜드의 가치관",
    children: [
      { label: "THE BEGINNING", href: "/brand/#beginning", description: "브랜드가 시작된 배경" },
      { label: "OUR PHILOSOPHY", href: "/brand/#philosophy", description: "브랜드의 철학과 가치관" },
      { label: "OUR IDENTITY", href: "/brand/#identity", description: "브랜드가 추구하는 정체성" },
      { label: "THE TAILORING", href: "/brand/#tailoring", description: "정교한 맞춤 제작 희망 시, 오프라인 테일러샵 매장 안내" },
      { label: "OUR SYMBOL", href: "/brand/#symbol", description: "브랜드명, 로고 등의 상징과 의미" },
    ],
  },
  {
    label: "THE GUIDE",
    href: "/guide/",
    description: "브랜드 이용 가이드",
    children: [
      { label: "MADE TO ORDER", href: "/guide/#order", description: "주문 후 제작 방식, 제작 프로세스, 주문 시 유의사항" },
      { label: "Size Guide", href: "/guide/#size", description: "제품별 사이즈 선택법, 실측 기준, 체형별 선택 방법" },
      { label: "Alterations", href: "/guide/#alteration", description: "소매 · 바지 기장 등의 수선 안내 및 권장사항" },
      { label: "Delivery", href: "/guide/#delivery", description: "제작 기간, 출고 예정일, 배송 방식" },
      { label: "Care", href: "/guide/#care", description: "수트 · 셔츠 · 팬츠 · 신발류 등의 세탁, 보관 및 관리 방법" },
    ],
  },
  {
    label: "THE LOOKBOOK",
    href: "/lookbook/",
    description: "브랜드가 추구하는 스타일링 룩북 모음집",
    children: [
      {
        label: "LEONE CLASSIC COLLECTION",
        href: "/lookbook/#leone",
        description: "전통적인 남성 포멀웨어의 기준과 클래식한 실루엣을 중심으로 한 라인",
      },
      {
        label: "FERITO ATHLETIC COLLECTION",
        href: "/lookbook/#ferito",
        description: "발달된 체형과 남성적인 실루엣을 강조하는 애슬레틱 포멀웨어 라인",
      },
    ],
  },
];

const CATEGORY_GROUPS: NavGroup[] = CATEGORY_NAV.map((c) => ({
  label: c.label,
  href: categoryHref(c.slug),
  description: c.description,
  children: (CATEGORY_SUBS[c.category] ?? []).map((s) => ({
    label: s.label,
    href: subHref(c.slug, s.slug),
    description: s.description,
  })),
}));

const SERVICE_GROUP: NavGroup = {
  label: "CLIENT SERVICES",
  href: "/qna/",
  description: "고객 서비스 안내",
  children: [
    { label: "CONTACT US", href: KAKAO_CHANNEL.chat, description: "문의 접수 — 카카오톡 채널 연결", external: true },
    { label: "MY ACCOUNT", href: "/mypage/", description: "고객 정보 안내 (등급 · 개인정보)" },
    { label: "ORDER HISTORY", href: "/mypage/#orders", description: "주문 내역" },
    { label: "ORDER STATUS", href: "/mypage/#order-status", description: "주문 · 제작 · 배송 현황" },
    { label: "RETURNS & EXCHANGES", href: "/mypage/#returns", description: "교환 · 반품 관리" },
    { label: "FAQ", href: "/qna/", description: "자주 묻는 질문" },
  ],
};

export const SITE_NAV: NavGroup[] = [...BRAND_GROUPS, ...CATEGORY_GROUPS, SERVICE_GROUP];

/**
 * 헤더 정리 (2026-10-06 요청 — "THE MAISON · THE GUIDE · THE LOOKBOOK · CLIENT SERVICES 를 하나로").
 * 넷을 ABOUT 한 칸으로 묶고, 헤더 한 줄은 MAIN · ABOUT · 분류 여섯이 된다.
 * ABOUT 을 열면 넓은 판에 네 묶음이 열(column)로 나란히 나온다 — 하위 메뉴는 구조표 그대로다.
 */
export const ABOUT_LABEL = "ABOUT";
export const ABOUT_GROUPS: NavGroup[] = [...BRAND_GROUPS, SERVICE_GROUP];
export { CATEGORY_GROUPS };
