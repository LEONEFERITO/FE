import type { Metadata } from "next";

import { FindEmailForm } from "@/components/auth/FindEmailForm";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AUTH_CONNECTED } from "@/lib/auth";

/**
 * 아이디 찾기 — 로그인 아이디는 가입한 이메일이다. 이름과 휴대폰 번호로 가린 이메일을 보여 준다(BE FindEmailService).
 */

export const metadata: Metadata = {
  title: "아이디 찾기",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="on-cream flex-1">
        <div className="mx-auto w-full max-w-[440px] px-5 py-16 md:py-24">
          {/* 제목 위 "— ACCOUNT" 는 2026-10-28 디자이너 요청으로 뺐다 */}
          <h1 className="font-display text-primary leading-display tracking-display text-3xl md:text-4xl">
            아이디 찾기
          </h1>
          <p className="text-secondary mt-4 text-sm leading-relaxed">
            로그인 아이디는 가입한 이메일입니다. 이름과 휴대폰 번호를 적어 주시면 가입된 이메일을 일부 가려서 보여 드립니다.
          </p>

          {!AUTH_CONNECTED && (
            <p className="border-subtle bg-band/60 text-muted text-2xs mt-7 rounded-xl border px-4 py-3 leading-relaxed">
              화면 확인 단계입니다. 회원 서버는 아직 연결되지 않았습니다.
            </p>
          )}

          <div className="mt-8">
            <FindEmailForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
