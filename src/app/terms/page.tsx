import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/LegalDocument";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PageBand } from "@/components/ui/PageBand";
import { TERMS } from "@/data/terms";
import { shareMetadata } from "@/lib/metadata";
import { pendingLabel } from "@/lib/pending";

/**
 * 이용약관.
 *
 * 회원가입 폼이 이 페이지에 동의를 받는다. 본문은 data/terms.ts —
 * 공정위 전자상거래 표준약관을 이 몰에 맞춘 것이다.
 *
 * TODO(고객확인) 약관 검토 · 시행일. 확정 전까지는 색인하지 않는다.
 */

export const metadata: Metadata = shareMetadata({
  title: "이용약관",
  description: "LEONE FERITO 온라인몰 이용약관.",
  // 고객 검토 전 초안이다. 확정되면 이 줄을 걷는다 (사이트 전체 noindex 와 별개).
  robots: { index: false, follow: false },
});

export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        <PageBand
          eyebrow="LEGAL"
          title="이용약관"
          description={`시행일 ${TERMS.effectiveDate ?? pendingLabel()}`}
        />
        <div className="on-cream">
          <LegalDocument doc={TERMS} />
        </div>
      </main>
      <Footer />
    </>
  );
}
