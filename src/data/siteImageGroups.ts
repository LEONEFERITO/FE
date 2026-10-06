import type { SiteImageSlot } from "@/lib/console";

/**
 * 관리자 "사이트 사진" 화면의 묶음 — 어느 손님 화면의 어느 칸인지 (서버 site_image, V20 · V22 · V23).
 *
 * 한 묶음 = 관리자 화면 한 장. 칸마다 손님 화면에서의 자리와 권장 비율을 적어 둔다 — 관리자는 코드가 아니라
 * 이 설명을 보고 올린다. 비운 칸이 손님 화면에서 어떻게 되는지(fallback)도 여기 적는다.
 *
 * 칸을 늘리면: 서버 SiteImageSlot + 마이그레이션 → lib/siteImages.ts · lib/console.ts 타입 → 여기 → 손님 화면.
 */

export interface SiteImageSlotSpec {
  slot: SiteImageSlot;
  label: string;
  /** 어디에 어떻게 나오는지 */
  hint?: string;
  aspect: "portrait" | "square" | "wide";
}

export interface SiteImageSection {
  title: string;
  description?: string;
  slots: SiteImageSlotSpec[];
}

export interface SiteImageGroup {
  key: string;
  href: string;
  title: string;
  description: string;
  /** 손님 화면 주소 — 저장 뒤 확인하러 가는 길 */
  previewHref: string;
  /** 한 줄에 놓는 칸 수 (PC) */
  columns: 2 | 3 | 5;
  sections: SiteImageSection[];
}

const line5 = (line: "LEONE" | "FERITO"): SiteImageSlotSpec[] =>
  ([1, 2, 3, 4, 5] as const).map((i) => ({
    slot: `LINE_${line}_${i}` as SiteImageSlot,
    label: `${i}번 칸`,
    aspect: "portrait",
  }));

export const SITE_IMAGE_GROUPS: SiteImageGroup[] = [
  {
    key: "main-lines",
    href: "/admin/display/main-lines/",
    title: "메인 라인 카드",
    description: "메인의 '레오네 · 페리토, 두 가지 라인' 카드 두 장입니다. 비우면 그 라인의 첫 상품 사진이 나갑니다.",
    previewHref: "/",
    columns: 2,
    sections: [
      {
        title: "두 가지 라인",
        slots: [
          { slot: "MAIN_LINE_LEONE", label: "레오네 카드", hint: "세로 사진. 글자(LEONE · 설명 · 라인 보기)가 아래쪽에 얹힙니다.", aspect: "portrait" },
          { slot: "MAIN_LINE_FERITO", label: "페리토 카드", hint: "세로 사진. 글자가 아래쪽에 얹힙니다.", aspect: "portrait" },
        ],
      },
    ],
  },
  {
    key: "line",
    href: "/admin/display/line/",
    title: "라인 페이지 사진",
    description: "레오네 · 페리토 라인 페이지 위쪽의 사진 다섯 칸입니다. 왼쪽부터 1~5. 비운 칸은 그 라인 상품 사진으로 메우고, 없으면 회색 칸입니다.",
    previewHref: "/line/leone/",
    columns: 5,
    sections: [
      { title: "LEONE · 레오네 라인", description: "/line/leone/", slots: line5("LEONE") },
      { title: "FERITO · 페리토 라인", description: "/line/ferito/", slots: line5("FERITO") },
    ],
  },
  {
    key: "lookbook",
    href: "/admin/display/lookbook/",
    title: "룩북",
    description: "룩북의 컬렉션 컷입니다. 컬렉션마다 두 장 — 첫째가 넓은 칸, 둘째가 좁은 칸입니다. 비우면 제품 촬영본이 임시로 나갑니다.",
    previewHref: "/lookbook/",
    columns: 2,
    sections: [
      {
        title: "LEONE CLASSIC COLLECTION",
        slots: [
          { slot: "LOOKBOOK_LEONE_1", label: "1번 컷 (넓은 칸)", aspect: "wide" },
          { slot: "LOOKBOOK_LEONE_2", label: "2번 컷", aspect: "wide" },
        ],
      },
      {
        title: "FERITO ATHLETIC COLLECTION",
        slots: [
          { slot: "LOOKBOOK_FERITO_1", label: "1번 컷", aspect: "wide" },
          { slot: "LOOKBOOK_FERITO_2", label: "2번 컷 (넓은 칸)", aspect: "wide" },
        ],
      },
    ],
  },
  {
    key: "brand",
    href: "/admin/display/brand/",
    title: "브랜드 페이지 사진",
    description: "THE MAISON(브랜드) 페이지의 사진입니다. 비우면 제품 촬영본이 임시로 나갑니다. 브랜드 촬영본이 오면 여기에 올립니다.",
    previewHref: "/brand/",
    columns: 3,
    sections: [
      {
        title: "첫 화면",
        slots: [{ slot: "BRAND_HERO", label: "히어로 사진", hint: "세로 4:5. 스크롤하면 화면을 채우며 커집니다.", aspect: "portrait" }],
      },
      {
        title: "사진 구간 (입은 사람)",
        slots: [
          { slot: "BRAND_PHOTO_1", label: "1번 (큰 칸, 왼쪽)", aspect: "portrait" },
          { slot: "BRAND_PHOTO_2", label: "2번 (작은 칸, 왼쪽 아래)", aspect: "portrait" },
          { slot: "BRAND_PHOTO_3", label: "3번 (오른쪽 아래)", aspect: "portrait" },
        ],
      },
      {
        title: "첫인상 배경",
        slots: [{ slot: "BRAND_IMPRESSION", label: "배경 사진", hint: "가로 사진. 어둡게 깔리고 그 위에 문장이 떠오릅니다.", aspect: "wide" }],
      },
    ],
  },
  {
    key: "offline",
    href: "/admin/display/offline/",
    title: "매장 사진",
    description: "메인 OFFLINE SHOP 구간의 왼쪽 사진입니다. 비우면 기본 사진이 나갑니다.",
    previewHref: "/#offline-shop",
    columns: 2,
    sections: [
      {
        title: "OFFLINE SHOP",
        slots: [{ slot: "OFFLINE_SHOP", label: "매장 사진", hint: "가로 · 세로 어느 쪽이든 칸에 맞게 잘립니다. 제목이 왼쪽 아래에 얹히므로 그 자리가 어두운 사진이 읽기 좋습니다.", aspect: "square" }],
      },
    ],
  },
];

export const siteImageGroup = (key: string) => SITE_IMAGE_GROUPS.find((g) => g.key === key);
