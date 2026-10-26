import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/AuthCard";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getSiteImages } from "@/lib/siteImages";

/**
 * 회원가입. 화면은 로그인 · 회원가입 한 카드(components/auth/AuthCard) — 2026-10-26 고객 레퍼런스 영상.
 * 예전 분할 화면(왼쪽 촬영 원본 · 오른쪽 폼)은 걷었다.
 */

export const metadata: Metadata = {
  title: "회원가입",
  description: "LEONE FERITO 회원가입.",
  // 개인 화면 — 검색에 내지 않는다(2026-10-26 사이트 전체 noindex 를 풀면서)
  robots: { index: false, follow: false },
};

export default async function SignupPage() {
  // 패널 배경 사진 — 관리자 › 사이트 사진 › 로그인 화면(V38). 없으면 와인 그라데이션만
  const panelPhoto = (await getSiteImages()).AUTH_PANEL;
  return (
    <>
      <Header />

      {/* 로그인 · 회원가입 한 카드 — 패널이 미끄러지며 바뀐다(2026-10-26). 이 주소로 들어오면 회원가입 쪽이 열린다 */}
      <main id="main" className="on-cream bg-band flex flex-1 items-center justify-center px-4 py-10 md:px-10 md:py-16">
        <div className="w-full max-w-[960px]">
          <AuthCard initial="signup" panelPhoto={panelPhoto} />
        </div>
      </main>

      <Footer />
    </>
  );
}
