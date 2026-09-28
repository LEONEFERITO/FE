import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ComingSoon } from "@/components/ui/ComingSoon";

/**
 * 개인정보처리방침.
 *
 * ⚠️ 이용약관과 같다 — 회원가입에서 동의를 받는 문서이므로 문안 없이 열면 안 된다.
 * 회원 정보(이메일·이름·연락처)를 실제로 저장하기 시작하는 순간부터 법적으로 필수다.
 *
 * TODO(고객확인) 수집 항목 · 보관 기간 · 위탁 업체
 */

export const metadata: Metadata = {
  title: "개인정보처리방침",
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
          title="개인정보처리방침"
          description="수집 항목과 보관 기간을 정리하고 있습니다. 확정되는 대로 이곳에 게시합니다."
        />
      </main>
      <Footer />
    </>
  );
}
