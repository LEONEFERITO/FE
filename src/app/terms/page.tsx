import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ComingSoon } from "@/components/ui/ComingSoon";

/**
 * 이용약관.
 *
 * ⚠️ 회원가입 폼이 이 페이지에 동의를 받는다. **문안 없이 받은 동의는 무효다.**
 * 정식 오픈 전에 반드시 실제 약관으로 채워야 한다 — 이건 디자인이 아니라 법적 요건이다.
 *
 * TODO(고객확인) 약관 문안
 */

export const metadata: Metadata = {
  title: "이용약관",
  // 내용이 없는 페이지다. 색인되면 브랜드 검색 결과에 빈 껍데기가 뜬다.
  // 사이트 전체 noindex 를 걷어내는 날에도 이 줄은 남아야 한다.
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        <ComingSoon
          eyebrow="LEGAL"
          title="이용약관"
          description="약관 문안을 준비하고 있습니다. 확정되는 대로 이곳에 게시합니다."
        />
      </main>
      <Footer />
    </>
  );
}
