import type { Metadata } from "next";

import { AdminOrderDetail } from "@/components/admin/AdminOrderDetail";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/** 관리자 주문 상세 · 처리. `?no=` 주문번호 — 정적 내보내기라 동적 경로 대신 쿼리다. */

export const metadata: Metadata = {
  title: "주문 상세",
  robots: { index: false, follow: false },
};

export default function AdminOrderDetailPage() {
  return (
    <>
      <Header />

      <main id="main" className="on-cream flex-1">
        <div className="mx-auto max-w-[1320px] px-5 py-14 md:px-15 md:py-20">
          <AdminOrderDetail />
        </div>
      </main>

      <Footer />
    </>
  );
}
