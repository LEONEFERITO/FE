import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ComingSoon } from "@/components/ui/ComingSoon";

/**
 * 룩북 (요구사항 2-3).
 *
 * 촬영 대기. 이미지가 주인공인 페이지라 지금 틀만 만들어 두면
 * 촬영본이 왔을 때 맞지 않는다 — 컷 비율과 수량을 보고 짠다.
 */

export const metadata: Metadata = {
  title: "룩북",
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
          eyebrow="LOOKBOOK"
          title="룩북"
          description="엠버서더·모델 스타일 모음입니다. 촬영본이 나오면 채워집니다."
        />
      </main>
      <Footer />
    </>
  );
}
