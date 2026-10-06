import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { AUTH_CONNECTED } from "@/lib/auth";

/**
 * 로그인.
 *
 * ── 구성 ────────────────────────────────────────────────
 * 데스크톱은 히어로와 같은 분할이다 — 왼쪽 촬영 원본, 오른쪽 폼.
 * 로그인은 유틸리티 화면이지만 이 브랜드에서 사진은 배경이 아니라 재료라,
 * 다른 화면과 어휘가 끊기면 여기만 남의 사이트처럼 보인다.
 * 모바일에서는 사진을 뺀다 — 폼이 첫 화면에 다 들어와야 한다.
 *
 * ── 아직 서버가 없다 ────────────────────────────────────
 * 인증 API 는 Phase 5 다. 폼·검증·오류 표시·접근성은 전부 완성돼 있고
 * 연결부만 lib/auth.ts 하나에 격리해 뒀다. 눌렀을 때 조용히 아무 일도 없으면
 * 고장으로 보이므로, 상단에 지금 단계를 한 줄로 밝힌다.
 *
 * TODO(고객확인) C-1 — 아이디 대신 이메일로 받는다고 가정했다.
 * 비밀번호 찾기·주문 안내가 전부 이메일을 전제하므로 이메일이 기본이다.
 */

export const metadata: Metadata = {
  title: "로그인",
  description: "LEONE FERITO 회원 로그인.",
};

export default function LoginPage() {
  return (
    <>
      <Header />

      <main id="main" className="on-cream flex-1">
        <div className="grid min-h-[calc(100dvh-56px)] md:min-h-[calc(100dvh-72px)] md:grid-cols-2">
          {/* 왼쪽 — 촬영 원본. 모바일에서는 숨긴다 */}
          <div className="bg-velvet relative hidden overflow-hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/products/photo-black-shirt.webp"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
            />
          </div>

          {/* 오른쪽 — 폼. 좁게 묶어 읽는 폭을 유지한다 */}
          <div className="flex items-center justify-center px-5 py-16 md:px-14 md:py-20">
            <div className="w-full max-w-[400px]">
              <Eyebrow>ACCOUNT</Eyebrow>
              <h1 className="font-display text-primary leading-display tracking-display mt-3 text-3xl md:text-4xl">
                로그인
              </h1>
              <p className="text-secondary mt-4 text-sm">
                주문 내역과 사이즈 기록을 이어서 보실 수 있습니다.
              </p>

              {!AUTH_CONNECTED && (
                /*
                  화면 확인 단계라는 사실을 미리 밝힌다.
                  누르고 나서야 "연결되지 않았습니다" 를 보면 고장으로 읽힌다.
                */
                <p className="border-subtle bg-band/60 text-muted mt-7 rounded-xl border px-4 py-3 text-2xs leading-relaxed">
                  화면 확인 단계입니다. 로그인 서버는 아직 연결되지 않았습니다.
                </p>
              )}

              <div className="mt-8">
                <LoginForm />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
