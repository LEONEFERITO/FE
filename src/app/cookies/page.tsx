import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/LegalDocument";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PageBand } from "@/components/ui/PageBand";
import { COOKIES } from "@/data/cookies";
import { shareMetadata } from "@/lib/metadata";

/**
 * 쿠키 정책. 본문은 data/cookies.ts — 이 사이트가 실제로 심는 쿠키(세션 · 위조 방지 둘)만 적었다.
 * 개인정보처리방침의 "자동으로 생성·수집되는 정보" 가 이 페이지로 잇는다.
 */

export const metadata: Metadata = shareMetadata({
  title: "쿠키 정책",
  description: "LEONE FERITO 온라인몰이 사용하는 쿠키와 거부 방법.",
  robots: { index: false, follow: false },
});

export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        <PageBand eyebrow="LEGAL" title="쿠키 정책" description={`시행일 ${COOKIES.effectiveDate}`} />
        <div className="on-cream">
          <LegalDocument doc={COOKIES} />
        </div>
      </main>
      <Footer />
    </>
  );
}
