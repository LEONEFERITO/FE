import type { Metadata } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * 공유 미리보기(OG) 메타데이터.
 *
 * ── 왜 모듈로 빼는가 ────────────────────────────────────
 * Next 의 metadata 는 세그먼트끼리 **얕게** 병합된다. `openGraph` 처럼 중첩된 키는
 * 뒤 세그먼트가 정의하면 앞 세그먼트의 것이 **통째로 교체된다** — 필드별로 섞이지 않는다
 * (node_modules/next/dist/docs/.../generate-metadata.md "Merging").
 *
 * 그래서 페이지가 og 제목을 자기 것으로 쓰려면 공통 필드(siteName · locale · 이미지)를
 * 직접 다시 넣어야 한다. 그걸 페이지마다 손으로 적으면 한 곳만 빠져도 조용히 어긋난다.
 * 여기 한 군데서 만든다.
 *
 * ── 반대로, 루트에만 두면 안 되는 이유 ──────────────────
 * 페이지가 `title` 만 바꾸고 `openGraph` 를 두지 않으면 루트의 og 를 그대로 물려받는다.
 * 즉 og:title 은 페이지 제목이 아니라 **루트의 제목**이 된다(위 문서 "Inheriting fields").
 * 카톡에 /brand 를 붙여도 "LEONE FERITO" 만 뜨는 셈이다. 공개 페이지는 각자 선언한다.
 */

const BRAND = "LEONE FERITO";

/** 루트 설명. layout.tsx 의 description 과 og:description 이 같은 문장을 쓴다. */
export const BRAND_DESCRIPTION =
  "운동으로 달라진 체형을 위한 남성 기성복. 핏과 실측을 모두 공개합니다.";

/**
 * 공유 기본 이미지.
 *
 * 메인 WHY 구간 배경과 같은 사진이다(app/page.tsx WHY_BACKGROUND).
 * 1600×900 — 카톡·페이스북이 큰 카드로 쓰는 비율(1.91:1)에 가깝고 최소 너비 600px 을 넘는다.
 *
 * TODO(고객확인) 공유 전용 대표컷. 브랜드 촬영본이 오면 1200×630 으로 따로 받는다.
 */
const SHARE_IMAGE = {
  url: "/brand/tailoring.webp",
  width: 1600,
  height: 900,
  alt: "LEONE FERITO — 테일러링 디테일",
};

/** 이미 절대 주소면 metadataBase 없이도 공유 봇이 받아 간다 (업로드 이미지가 CDN 주소일 때). */
const isAbsolute = (url: string) => /^https?:\/\//.test(url);

/**
 * og:image 를 넣을지 정한다.
 *
 * 상대경로는 Next 가 `metadataBase` 로 절대 주소를 만든다. 그런데 metadataBase 는
 * 도메인(NEXT_PUBLIC_SITE_URL)이 있을 때만 설정된다(layout.tsx) — 없으면 Next 가
 * `http://localhost:3000` 을 끼워 넣는다. 그 주소가 박힌 카드는 카톡이 이미지를 못 받아
 * **깨진 카드**가 된다. 빈 카드(글자만)보다 나쁘다.
 *
 * 그래서 "도메인이 없고 주소도 상대경로" 인 경우에만 이미지를 생략한다.
 * 도메인을 넣는 순간 재빌드에서 저절로 붙는다.
 */
function ogImages(image?: string | null) {
  if (image) {
    if (isAbsolute(image) || SITE_URL) return { images: [image] };
    return {};
  }
  return SITE_URL ? { images: [SHARE_IMAGE] } : {};
}

/** 모든 페이지가 공유하는 og 공통 필드. 페이지 고유 값(title·description)은 부르는 쪽이 얹는다. */
export function openGraphBase(image?: string | null) {
  return {
    type: "website" as const,
    siteName: BRAND,
    locale: "ko_KR",
    ...ogImages(image),
  };
}

/**
 * 공개 페이지의 metadata.
 *
 * `title` 은 `<title>` 에 템플릿(`%s | LEONE FERITO`, layout.tsx)이 붙지만 og:title 에는
 * 붙지 않는다 — og 는 교체되는 키라 템플릿을 타지 않는다. 그래서 여기서 직접 붙인다.
 */
export function shareMetadata(input: {
  /** 페이지 제목. 없으면 브랜드명만 쓴다(홈). */
  title?: string;
  description: string;
  /** 대표 이미지 주소. 없으면 브랜드 기본 이미지. */
  image?: string | null;
  /** 페이지가 따로 색인을 막을 때 (약관 초안 등). */
  robots?: Metadata["robots"];
}): Metadata {
  const { title, description, image, robots } = input;
  return {
    ...(title ? { title } : {}),
    description,
    ...(robots ? { robots } : {}),
    openGraph: {
      ...openGraphBase(image),
      title: title ? `${title} | ${BRAND}` : BRAND,
      description,
    },
  };
}
