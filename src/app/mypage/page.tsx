import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ComingSoon } from "@/components/ui/ComingSoon";

/**
 * 마이페이지 (요구사항 5).
 *
 * 이름·연락처·주소·장바구니·찜·포인트·누적 구매금액·등급.
 *
 * 포인트와 등급은 적립률·유효기간·승급 기준이 정해져야 만들 수 있다.
 * 규칙 없이 화면부터 만들면 반드시 다시 만든다 (BRAND_BRIEF.md 4장).
 */

export const metadata: Metadata = {
  title: "마이페이지",
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
          eyebrow="ACCOUNT"
          title="마이페이지"
          description="주문 내역·장바구니·찜·포인트·등급을 담을 자리입니다. 로그인 후 이용하실 수 있습니다."
        />
      </main>
      <Footer />
    </>
  );
}
