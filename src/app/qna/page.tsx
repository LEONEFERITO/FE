import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ComingSoon } from "@/components/ui/ComingSoon";

/**
 * QnA (요구사항 3).
 *
 * 카카오톡 채널 연결이 함께 들어간다. 채널 ID 가 아직 없다 —
 * BRAND_BRIEF.md 4장의 '아직 필요한 것' 참고.
 */

export const metadata: Metadata = {
  title: "QnA",
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
          eyebrow="QNA"
          title="QnA"
          description="자주 묻는 질문과 카카오톡 채널 연결을 담을 자리입니다."
        />
      </main>
      <Footer />
    </>
  );
}
