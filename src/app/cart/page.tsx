import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ComingSoon } from "@/components/ui/ComingSoon";

/**
 * 장바구니.
 *
 * 헤더의 CART 링크가 가리키는 곳이다. 실제 담기 기능은 주문·결제 도메인과 함께 온다
 * (BRAND_BRIEF.md 3장). 그전까지 404 를 두면 헤더를 누르는 족족 오류 화면이 뜬다.
 */

export const metadata: Metadata = {
  title: "장바구니",
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
          eyebrow="CART"
          title="장바구니"
          description="주문 기능은 결제 수단과 제작 기간이 확정된 뒤 열립니다. 그때까지는 문의로 주문을 받습니다."
        />
      </main>
      <Footer />
    </>
  );
}
