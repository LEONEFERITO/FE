import type { Metadata } from "next";
import { Gelasio, Inria_Serif, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { CategoryOrderProvider } from "@/components/layout/CategoryOrder";
import { QuickMenu } from "@/components/layout/QuickMenu";
import { getCategoryOrder } from "@/lib/categoryOrder";
import { BRAND_DESCRIPTION, openGraphBase } from "@/lib/metadata";
import { SITE_URL } from "@/lib/site";

/**
 * 폰트 — 영문 세리프 / 국문 고딕 (고객 지시 2026-09-28)
 *
 * CSS font-family 폴백이 글리프 단위로 동작하는 성질을 쓴다.
 * 라틴 세리프를 앞에, 한글 고딕을 뒤에 두면 알아서 나뉜다:
 *   "LEONE" → 라틴 세리프에 있음 → 세리프
 *   "기성복" → 라틴 세리프에 없음 → Noto Sans KR 로 떨어짐 → 고딕
 *
 * 그래서 라틴 폰트에 **한글 글리프가 없어야 한다.**
 * (이전에 쓰던 Noto Serif KR 은 한글을 갖고 있어 한글까지 세리프가 됐다 — 제거함)
 * 서브셋은 next/font/google 의 font-data.json 에서 직접 확인했다.
 */

/**
 * 라틴 글꼴은 Gelasio (2026-10-20 디자이너 "글씨체는 Gelasio") — 표제 · 본문 둘 다. 전에는 표제 Playfair Display · 본문 Spectral.
 * Gelasio 는 Georgia 와 같은 폭의 세리프라 숫자 · 영문이 한글 고딕 옆에서 튀지 않는다. 라틴 전용(한글 글리프 없음 — 위 머리말의 전제).
 * 700 은 제목 전부 굵게(2026-10-08 고객 요청).
 */
const display = Gelasio({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-latin",
  display: "swap",
});

/** 상품 카드 글자 — Inria Serif (2026-10-20 디자이너 "여기 글씨체는 Inria Serif"). 라틴 전용 — 한글은 Noto Sans KR 로 떨어진다 */
const card = Inria_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-card-latin",
  display: "swap",
});

/** 본문용 라틴 — 같은 Gelasio. 변수 이름만 다르다(globals.css 의 --font-body 가 이 이름을 본다) */
const body = Gelasio({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body-latin",
  display: "swap",
});

/**
 * 한글 전담 고딕.
 *
 * subsets 를 지정하지 않고 preload: false 를 쓰는 이유:
 * subsets 는 "무엇을 preload 할지" 를 정하는 옵션이다. 한글 글리프는 라틴보다
 * 수십 배 커서 preload 하면 첫 화면이 그만큼 늦어진다.
 * 폰트 자체는 Next 가 self-host 하므로 한글은 정상 출력된다.
 */
const korean = Noto_Sans_KR({
  // 300: 라인 페이지 소개 글(2026-10-17 시안 Light). 없으면 브라우저가 400 으로 대신 그려 시안과 달라진다
  weight: ["300", "400", "500", "700"],
  variable: "--font-korean",
  display: "swap",
  preload: false,
});

/**
 * 사이트 전역 메타데이터.
 *
 * 확인되지 않은 값은 채우지 않는다. 메타데이터는 검색엔진에 등록되고 카톡 공유
 * 미리보기에 그대로 박혀 나가므로, 틀린 값이 나가면 빈칸보다 나쁘다.
 *   - 브랜드 스토리·슬로건: CLIENT_QUESTIONS F-2
 *   - 도메인 (metadataBase / OG 절대경로에 필요): CLIENT_QUESTIONS G-1
 */
export const metadata: Metadata = {
  // 2026-10-26 SEO: 한글 이름으로 찾는 손님이 많아 제목에 "레오네페리토" 를 같이 둔다. 하위 페이지는 "제품 | LEONE FERITO 레오네페리토"
  title: {
    default: "LEONE FERITO 레오네페리토 | 운동한 체형을 위한 남성 기성복",
    template: "%s | LEONE FERITO 레오네페리토",
  },
  description: BRAND_DESCRIPTION,
  applicationName: "LEONE FERITO",
  keywords: ["레오네페리토", "LEONE FERITO", "남성 기성복", "운동 체형 수트", "남자 수트", "남성 셔츠", "트라우저", "실측 공개", "더맨리"],

  /*
    검색 사이트 소유 확인 — 구글 서치콘솔 · 네이버 서치어드바이저에서 받은 코드.
    서버 .env 에 NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION · NEXT_PUBLIC_NAVER_SITE_VERIFICATION 으로 넣으면
    다음 빌드부터 <meta> 가 붙는다. 없으면 태그를 안 낸다.
  */
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION
      ? { other: { "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION } }
      : {}),
  },

  // 도메인(NEXT_PUBLIC_SITE_URL · lib/site.ts)이 있으면 지정한다. 없으면 og:image 가 상대경로로 나가
  // 카톡·인스타가 이미지를 읽지 못한다 — TODO(고객확인) G-1 도메인.
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),

  /*
    공유 미리보기 — 홈(/)의 카드이면서, og 를 따로 선언하지 않는 페이지(로그인 · 장바구니 ·
    관리자 등)가 물려받는 기본값이다. 공개 페이지는 각자 shareMetadata() 로 자기 카드를
    선언한다 — og 는 교체되는 키라 루트 하나로는 페이지별 제목이 나오지 않는다(lib/metadata.ts).

    twitter 는 따로 적지 않는다. Next 가 openGraph 에서 twitter:card · title · description 을
    만들어 준다 — 같은 값을 두 번 적으면 한쪽만 고치는 날이 온다.
  */
  openGraph: {
    ...openGraphBase(),
    title: "LEONE FERITO 레오네페리토",
    description: BRAND_DESCRIPTION,
  },

  /*
    검색 노출 — 2026-10-26 허용(오픈 전 전면 차단 noindex 를 풀었다). 개인 화면(로그인 · 주문 · 관리자 등)은
    robots.ts 가 막고, 각 페이지도 noindex 를 따로 단다. 이미지 미리보기는 크게(max-image-preview) 허락한다.
  */
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  /** 분류 메뉴 순서 — 관리자 › 분류 순서. 빌드 때 받아 헤더(클라이언트)에 맥락으로 넘긴다 */
  const categoryOrder = await getCategoryOrder();
  return (
    <html
      // 한국어 사이트다. lang 이 en 이면 스크린리더가 한글을 영어 발음으로 읽고
      // 브라우저 번역이 엉뚱하게 동작한다.
      lang="ko"
      // 아래 인라인 스크립트가 React 보다 먼저 <html> 에 data-motion="on" 을 붙인다.
      // 서버 HTML 에는 그 속성이 없으므로 React 가 "속성이 다르다" 고 경고한다
      // (개발 배지 "1 Issue" 의 정체). 이 요소의 속성 차이만 무시한다 — 자식에게는 번지지 않는다.
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${card.variable} ${korean.variable} h-full antialiased`}
    >
      <body className="bg-page text-primary flex min-h-full flex-col">
        {/*
          스킵 링크 — 키보드 사용자가 헤더 링크 여섯 개를 건너뛰고 본문으로 간다.
          body 의 **첫 초점 요소**여야 하므로 스크립트보다 앞에 둔다.
          평소엔 sr-only 로 숨고 초점이 오면 화면 좌상단에 나타난다.
        */}
        <a
          href="#main"
          className="bg-accent text-on-accent sr-only rounded-full text-sm focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:px-5 focus-visible:py-3"
        >
          본문으로 건너뛰기
        </a>
        {/*
          스크롤 진입 연출을 **JS 가 있을 때만** 켠다.

          CSS 에서 .reveal 의 기본값을 opacity:0 으로 두면, IntersectionObserver 가
          어떤 이유로든 발화하지 않을 때 본문이 영영 안 보인다. 정적 사이트라 더 치명적이다 —
          JS 차단 환경이나 크롤러에게 빈 페이지가 나간다.

          그래서 반대로 뒤집었다: 기본은 보이는 상태, 이 스크립트가 붙어야 숨김+애니메이션이 켜진다.
          본문보다 먼저 동기 실행되므로 "보였다가 사라지는" 깜빡임도 없다.
          (globals.css 의 html[data-motion="on"] 선택자와 짝이다)
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.dataset.motion="on"`,
          }}
        />
        <CategoryOrderProvider order={categoryOrder}>
          {children}
          <QuickMenu />
        </CategoryOrderProvider>
      </body>
    </html>
  );
}
