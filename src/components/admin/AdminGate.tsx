"use client";

import { LockSimple } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AUTH_CONNECTED, fetchCurrentUser, isAdmin, loginUrl } from "@/lib/auth";

/**
 * 관리자 화면 입구 안내.
 *
 * ⚠️ 보안 장치가 아니다 — 정적 사이트라 주소만 알면 화면 파일은 누구나 받는다.
 * 막는 건 서버다(`/api/admin/**` = ADMIN). 이건 권한 없는 사람이 빈 폼 앞에서 헤매다
 * 저장을 눌러서야 "권한이 없습니다" 를 듣지 않게, **들어오는 순간** 알려 주는 안내다.
 *
 * 서버가 연결되지 않은 화면 확인 단계에서는 그대로 보여 준다(화면 QA 용).
 */
type Gate = "checking" | "ok" | "login" | "forbidden";

export function AdminGate({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const [gate, setGate] = useState<Gate>(AUTH_CONNECTED ? "checking" : "ok");

  useEffect(() => {
    if (!AUTH_CONNECTED) return;
    let alive = true;
    fetchCurrentUser().then((u) => {
      if (alive) setGate(!u ? "login" : isAdmin(u) ? "ok" : "forbidden");
    });
    return () => {
      alive = false;
    };
  }, []);

  if (gate === "ok") return <>{children}</>;

  return (
    <>
      {header}
      <main id="main" className="on-cream flex-1">
        <div className="mx-auto max-w-[720px] px-5 py-20 md:px-15 md:py-28">
          {gate === "checking" ? (
            <p aria-busy="true" className="text-muted text-sm">
              관리자 권한을 확인하는 중
            </p>
          ) : (
            <div className="border-subtle bg-surface flex flex-col items-start gap-4 rounded-2xl border p-8">
              <LockSimple size={28} weight="light" aria-hidden="true" className="text-accent" />
              <h1 className="font-display text-primary text-2xl">관리자 화면입니다</h1>
              <p className="text-secondary text-sm leading-relaxed">
                {gate === "login"
                  ? "관리자 계정으로 로그인하면 이 화면으로 돌아옵니다."
                  : "지금 계정에는 관리자 권한이 없습니다. 권한이 필요하면 최고 관리자에게 요청해 주세요."}
              </p>
              {gate === "login" ? (
                <a
                  href={loginUrl()}
                  className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 items-center rounded-full px-6 text-sm transition-colors duration-300"
                >
                  로그인
                </a>
              ) : (
                <Link href="/" className="text-accent min-h-11 text-sm underline underline-offset-4">
                  메인으로
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
      {footer}
    </>
  );
}
