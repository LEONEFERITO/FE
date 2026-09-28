import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/SignupForm";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { AUTH_CONNECTED } from "@/lib/auth";

/**
 * 회원가입.
 *
 * 로그인 화면과 같은 분할 구성이다 — 왼쪽 촬영 원본, 오른쪽 폼.
 * 다만 사진을 **다르게** 쓴다. 두 화면을 오갈 때 같은 사진이면 화면이 안 바뀐 것처럼 보인다.
 *
 * 폼이 로그인보다 길어서(6칸) 세로 가운데 정렬 대신 위쪽에 붙인다.
 * 가운데 정렬은 짧은 폼에서만 안정적으로 보이고, 길어지면 첫 칸이 화면 밖으로 밀린다.
 */

export const metadata: Metadata = {
  title: "회원가입",
  description: "LEONE FERITO 회원가입.",
};

export default function SignupPage() {
  return (
    <>
      <Header />

      <main id="main" className="flex-1">
        <div className="grid min-h-[calc(100dvh-56px)] md:min-h-[calc(100dvh-72px)] md:grid-cols-2">
          {/* 왼쪽 — 촬영 원본. 모바일에서는 숨긴다(폼이 첫 화면에 들어와야 한다) */}
          <div className="bg-velvet relative hidden overflow-hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/products/photo-grey-shirt.webp"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]"
            />
          </div>

          {/* 오른쪽 — 폼 */}
          <div className="flex justify-center px-5 py-16 md:px-14 md:py-20">
            <div className="w-full max-w-[400px]">
              <Eyebrow>ACCOUNT</Eyebrow>
              <h1 className="font-display text-primary leading-display tracking-display mt-3 text-3xl md:text-4xl">
                회원가입
              </h1>
              <p className="text-secondary mt-4 text-sm leading-relaxed">
                주문 내역과 사이즈 기록이 계정에 남습니다.
              </p>

              {!AUTH_CONNECTED && (
                /*
                  누르고 나서야 "연결되지 않았습니다" 를 보면 고장으로 읽힌다.
                  AUTH_CONNECTED 는 API 주소가 들어오면 자동으로 켜진다.
                */
                <p className="border-subtle bg-band/60 text-muted text-2xs mt-7 rounded-xl border px-4 py-3 leading-relaxed">
                  화면 확인 단계입니다. 가입 서버는 아직 연결되지 않았습니다.
                </p>
              )}

              <div className="mt-8">
                <SignupForm />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
