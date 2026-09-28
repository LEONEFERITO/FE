import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ComingSoon } from "@/components/ui/ComingSoon";

/**
 * 비밀번호 찾기.
 *
 * 로그인 화면에서 링크로 이어진다. 메일 발송이 붙어야 실제로 동작하므로
 * (재설정 토큰을 메일로 보내야 한다) 그때까지 자리만 지킨다.
 */

export const metadata: Metadata = {
  title: "비밀번호 찾기",
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
          title="비밀번호 찾기"
          description="가입하신 이메일로 재설정 링크를 보내드릴 예정입니다. 메일 발송 설정이 끝나면 열립니다."
        />
      </main>
      <Footer />
    </>
  );
}
