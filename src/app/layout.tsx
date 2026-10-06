import type { Metadata } from "next";
import { Noto_Sans_KR, Playfair_Display, Spectral } from "next/font/google";
import "./globals.css";
import { QuickMenu } from "@/components/layout/QuickMenu";
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

/** 표제용. 로고가 고대비 Didone 세리프라 같은 계열로 맞췄다. 라틴 전용. */
const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display-latin",
  display: "swap",
});

/** 본문용 라틴. 화면 본문 설계 폰트라 x-height 가 커서 한글 고딕 옆에서 덜 튄다. */
const body = Spectral({
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
  weight: ["400", "500", "700"],
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
  title: {
    default: "LEONE FERITO",
    template: "%s | LEONE FERITO",
  },
  description: BRAND_DESCRIPTION,

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
    title: "LEONE FERITO",
    description: BRAND_DESCRIPTION,
  },

  /*
    검색 노출 차단 — **오픈 전까지 유지한다.**

    지금 화면에는 "제품명 확인 중 · 가격 문의 · 실측 등록 전" 이 그대로 떠 있다.
    미리보기 주소가 색인되면 그 문구가 브랜드명 검색 결과가 되고, 한 번 색인된 것은
    지워도 한동안 남는다. 정식 도메인으로 오픈할 때 이 블록을 지운다.

    robots.txt(public/) 와 짝이다 — 크롤러에 따라 보는 곳이 다르다.
  */
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      // 한국어 사이트다. lang 이 en 이면 스크린리더가 한글을 영어 발음으로 읽고
      // 브라우저 번역이 엉뚱하게 동작한다.
      lang="ko"
      // 아래 인라인 스크립트가 React 보다 먼저 <html> 에 data-motion="on" 을 붙인다.
      // 서버 HTML 에는 그 속성이 없으므로 React 가 "속성이 다르다" 고 경고한다
      // (개발 배지 "1 Issue" 의 정체). 이 요소의 속성 차이만 무시한다 — 자식에게는 번지지 않는다.
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${korean.variable} h-full antialiased`}
    >
      <body className="bg-base text-primary flex min-h-full flex-col">
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
        {children}
        <QuickMenu />
      </body>
    </html>
  );
}
