"use client";

import { usePathname } from "next/navigation";

import { AdminSidebar, AdminTopBar, AdminTopNav } from "@/components/admin/AdminNav";

/**
 * 관리자 틀 — 위 띠 + 왼쪽 세로 메뉴 + 본문 (2026-10-06 고객 요청: "옆에 메뉴 있고 이런 식으로").
 *
 * 로그인 · 비밀번호 변경 화면(AdminGate 가 열어 두는 길)에서는 메뉴를 두지 않는다 — 아직 누군지 모르는 사람에게
 * 관리 메뉴를 보일 이유가 없고, 좁은 판 하나가 더 또렷하다. 위 띠는 남겨 "관리자 화면" 임을 알린다.
 * 좁은 화면(lg 미만)에서는 세로 메뉴 대신 본문 위에 가로 한 줄(AdminTopNav).
 */
const BARE = ["/admin/login", "/admin/password"];

export function AdminFrame({ children }: { children: React.ReactNode }) {
  const path = (usePathname() ?? "").replace(/\/$/, "");
  const bare = BARE.includes(path);

  return (
    <div className="on-cream on-white flex min-h-full flex-1 flex-col">
      <AdminTopBar />
      {bare ? (
        <main id="main" className="flex-1 px-5">{children}</main>
      ) : (
        <div className="flex flex-1">
          <aside className="border-subtle bg-base hidden w-56 shrink-0 border-r lg:block">
            <div className="sticky top-0 flex h-screen flex-col overflow-y-auto">
              <AdminSidebar />
            </div>
          </aside>
          <main id="main" className="min-w-0 flex-1 px-5 pb-20 pt-6 md:px-10 md:pt-10">
            <AdminTopNav />
            <div className="mt-6 lg:mt-0">{children}</div>
          </main>
        </div>
      )}
    </div>
  );
}
