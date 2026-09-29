import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ComingSoon } from "@/components/ui/ComingSoon";

/**
 * 브랜드 가치관 (요구사항 2-1).
 *
 * 슬로건과 키워드는 이미 BRAND_BRIEF.md 1-1 에 있다. 촬영본이 나오면
 * 그 문장들이 이미지와 함께 놓일 자리다.
 */

export const metadata: Metadata = {
  title: "브랜드",
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
          eyebrow="BRAND"
          title="브랜드"
          description="상위 0.1%의 남자. 브랜드가 지향하는 것과 슬로건을 담을 자리입니다."
        />
      </main>
      <Footer />
    </>
  );
}
