import type { Metadata } from "next";

import { AdminReturnDetail } from "@/components/admin/AdminReturnDetail";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/** 관리자 교환·반품 상세 · 처리. `?id=` 신청 번호 — 정적 내보내기라 동적 경로 대신 쿼리다. */

export const metadata: Metadata = {
  title: "교환 · 반품 상세",
  robots: { index: false, follow: false },
};

export default function AdminReturnDetailPage() {
  return (
    <>
      <Header />

      <main id="main" className="on-cream flex-1">
        <div className="mx-auto max-w-[1320px] px-5 py-14 md:px-15 md:py-20">
          <AdminReturnDetail />
        </div>
      </main>

      <Footer />
    </>
  );
}
