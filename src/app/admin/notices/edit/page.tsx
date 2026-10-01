import type { Metadata } from "next";

import { AdminNoticeEditor } from "@/components/admin/AdminNoticeEditor";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/** 공지 쓰기 · 고치기. `?id=` 가 있으면 고치기 — 정적 내보내기라 동적 경로 대신 쿼리다. */

export const metadata: Metadata = {
  title: "공지 쓰기",
  robots: { index: false, follow: false },
};

export default function AdminNoticeEditPage() {
  return (
    <>
      <Header />
      <main id="main" className="on-cream flex-1">
        <div className="mx-auto max-w-[1320px] px-5 py-14 md:px-15 md:py-20">
          <AdminNoticeEditor />
        </div>
      </main>
      <Footer />
    </>
  );
}
