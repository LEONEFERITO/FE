import type { Metadata } from "next";
import Link from "next/link";

import { PasswordResetRequestForm } from "@/components/auth/PasswordResetRequestForm";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AUTH_CONNECTED } from "@/lib/auth";

/**
 * 비밀번호 찾기 — 가입한 이메일로 재설정 링크를 받는다.
 * 링크를 누르면 /reset 으로 온다.
 */

export const metadata: Metadata = {
  title: "비밀번호 찾기",
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
            비밀번호 찾기
          </h1>
          <p className="text-secondary mt-4 text-sm leading-relaxed">
            가입하신 이메일을 적어 주시면 비밀번호를 새로 정할 수 있는 링크를 보내드립니다.
          </p>

          {!AUTH_CONNECTED && (
            <p className="border-subtle bg-band/60 text-muted text-2xs mt-7 rounded-xl border px-4 py-3 leading-relaxed">
              화면 확인 단계입니다. 회원 서버는 아직 연결되지 않았습니다.
            </p>
          )}

          <div className="mt-8">
            <PasswordResetRequestForm />
          </div>

          <p className="text-muted text-2xs mt-6 text-center">
            가입한 이메일이 기억나지 않으면{" "}
            <Link href="/find-id" className="text-accent underline underline-offset-4">
              아이디 찾기
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
