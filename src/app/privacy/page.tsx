import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/LegalDocument";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PageBand } from "@/components/ui/PageBand";
import { PRIVACY } from "@/data/privacy";
import { shareMetadata } from "@/lib/metadata";

/**
 * 개인정보처리방침. 본문은 data/privacy.ts — 이 사이트가 실제로 수집하는 것만 적었다.
 *
 * TODO(고객확인) 수탁업체(메일 발송). 사이트 전체 noindex 와 별개로 확정 전까지 색인하지 않는다.
 */

export const metadata: Metadata = shareMetadata({
  title: "개인정보처리방침",
  description: "LEONE FERITO 온라인몰 개인정보처리방침.",
  robots: { index: false, follow: false },
});

export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        <PageBand
          eyebrow="LEGAL"
          title="개인정보처리방침"
          description={`시행일 ${PRIVACY.effectiveDate}`}
        />
        <div className="on-cream">
          <LegalDocument doc={PRIVACY} />
        </div>
      </main>
      <Footer />
    </>
  );
}
