import type { Metadata } from "next";

import { AdminMemberDetail } from "@/components/admin/AdminMemberDetail";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/** 관리자 회원 상세 · 조치. `?id=` 로 회원을 받는다 — 이유는 `AdminMemberDetail` 주석. */

export const metadata: Metadata = {
  title: "회원 상세",
  robots: { index: false, follow: false },
};

export default function AdminMemberDetailPage() {
  return (
    <>
      <Header />

      <main id="main" className="on-cream flex-1">
        <div className="mx-auto max-w-[1320px] px-5 py-14 md:px-15 md:py-20">
          <AdminMemberDetail />
        </div>
      </main>

      <Footer />
    </>
  );
}
