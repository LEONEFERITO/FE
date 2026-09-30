import type { Metadata } from "next";

import { MypagePanel } from "@/components/account/MypagePanel";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PageBand } from "@/components/ui/PageBand";

/**
 * 마이페이지 (요구사항 5).
 *
 * 이름·연락처·주소·장바구니·찜·포인트·누적 구매금액·등급 중, 지금 서버가 주는 것은
 * 이름과 이메일뿐이다. 나머지는 자리와 이유만 둔다 — MypagePanel 주석 참고.
 */

export const metadata: Metadata = {
  title: "마이페이지",
  // 개인 화면이다. 사이트 전체 noindex 를 걷어내는 날에도 이 줄은 남아야 한다.
  robots: { index: false, follow: false },
};

export default function MypagePage() {
  return (
    <>
      <Header />

      <main id="main" className="flex-1">
        <PageBand
          eyebrow="ACCOUNT"
          title="마이페이지"
          description="주문 내역 · 포인트 · 등급"
        />

        <div className="on-cream">
          <div className="mx-auto max-w-[1320px] px-5 py-12 md:px-15 md:py-16">
            <MypagePanel />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
