"use client";

import { LockSimple } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { AUTH_CONNECTED, fetchCurrentUser, isAdmin } from "@/lib/auth";

/**
 * 관리자 화면 입구.
 *
 * ⚠️ 보안 장치가 아니다 — 정적 사이트라 주소만 알면 화면 파일은 누구나 받는다.
 * 막는 건 서버다(`/api/admin/**` = ADMIN, 임시 비밀번호면 PASSWORD_CHANGE_REQUIRED).
 * 이건 들어오는 순간 갈 곳으로 보내는 안내다:
 *   로그인 안 함        → /admin/login (다녀오면 이 화면으로)
 *   임시 비밀번호       → /admin/password
 *   관리자 아님         → 안내
 * 로그인 · 비밀번호 변경 화면 자체는 이 검사를 건너뛴다.
 *
 * 서버가 연결되지 않은 화면 확인 단계에서는 그대로 보여 준다(화면 QA 용).
 */
type Gate = "checking" | "ok" | "forbidden";

const OPEN_PATHS = ["/admin/login", "/admin/password"];

function here(): string {
  return window.location.pathname + window.location.search;
}

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
  // 로그인 · 비밀번호 변경 화면은 검사하지 않는다 (서버 HTML 에서는 false — 브라우저에서 다시 본다)
  const open = useSyncExternalStore(
    () => () => {},
    () => OPEN_PATHS.includes(window.location.pathname.replace(/\/$/, "")),
    () => false,
  );

  useEffect(() => {
    if (!AUTH_CONNECTED || open) return;
    let alive = true;
    fetchCurrentUser().then((u) => {
      if (!alive) return;
      if (!u) {
        window.location.replace(`/admin/login/?next=${encodeURIComponent(here())}`);
      } else if (!isAdmin(u)) {
        setGate("forbidden");
      } else if (u.mustChangePassword) {
        window.location.replace(`/admin/password/?next=${encodeURIComponent(here())}`);
      } else {
        setGate("ok");
      }
    });
    return () => {
      alive = false;
    };
  }, [open]);

  if (gate === "ok" || open) return <>{children}</>;

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
                지금 계정에는 관리자 권한이 없습니다. 관리자 계정으로 다시 로그인하거나, 권한이 필요하면 최고 관리자에게
                요청해 주세요.
              </p>
              <div className="flex flex-wrap gap-5">
                <Link href="/admin/login/" className="text-accent min-h-11 text-sm underline underline-offset-4">
                  관리자 로그인
                </Link>
                <Link href="/" className="text-secondary min-h-11 text-sm underline underline-offset-4">
                  메인으로
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      {footer}
    </>
  );
}
