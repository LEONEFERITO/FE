import type { Metadata } from "next";

import { PasswordResetForm } from "@/components/auth/PasswordResetForm";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * 새 비밀번호 정하기 — 비밀번호 찾기 메일 속 링크(/reset/#token=…)로 들어온다.
 *
 * referrer 를 끈다. 토큰은 # 뒤라 원래 Referer 에 실리지 않지만, 이 페이지에서
 * 다른 곳으로 나가는 요청에 이 주소가 따라가지 않게 한 겹 더 막는다.
 */

export const metadata: Metadata = {
  title: "새 비밀번호",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="on-cream flex-1">
        <div className="mx-auto w-full max-w-[440px] px-5 py-16 md:py-24">
          <Eyebrow>ACCOUNT</Eyebrow>
          <h1 className="font-display text-primary leading-display tracking-display mt-3 text-3xl md:text-4xl">
            새 비밀번호
          </h1>
          <p className="text-secondary mt-4 text-sm leading-relaxed">
            앞으로 쓰실 비밀번호를 정해 주세요.
          </p>
          <div className="mt-8">
            <PasswordResetForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
