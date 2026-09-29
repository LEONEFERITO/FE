import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ComingSoon } from "@/components/ui/ComingSoon";

/**
 * 브랜드 이용 메뉴얼 (요구사항 2-2).
 *
 * 여섯 가지가 들어간다: 주문 후 제작 방식 · 라인별 의도한 핏 · 사이즈 고르는 법 ·
 * 수령 후 수선 · 관리법 · 맞춤 제작 시 테일러샵 방문 안내.
 *
 * ⚠️ 이 중 '주문 후 제작' 은 단순 안내가 아니다. 제작 기간과 청약철회 제한을
 * **결제 전에** 고지해야 법적으로 성립한다 (BRAND_BRIEF.md 3장).
 */

export const metadata: Metadata = {
  title: "이용 안내",
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
          eyebrow="GUIDE"
          title="이용 안내"
          description="주문 후 제작 방식, 라인별 핏, 사이즈 고르는 법, 수선·관리, 테일러샵 방문 안내를 담을 자리입니다."
        />
      </main>
      <Footer />
    </>
  );
}
