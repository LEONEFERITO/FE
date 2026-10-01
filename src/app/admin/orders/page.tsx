import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/AdminNav";
import { AdminOrderList } from "@/components/admin/AdminOrderList";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Eyebrow } from "@/components/ui/Eyebrow";

/** 관리자 주문 목록. 접근 제어는 서버가 한다(`/api/admin/**` = ADMIN). */

export const metadata: Metadata = {
  title: "주문 관리",
  robots: { index: false, follow: false },
};

export default function AdminOrdersPage() {
  return (
    <>
      <Header />

      <main id="main" className="on-cream flex-1">
        <div className="mx-auto max-w-[1320px] px-5 py-14 md:px-15 md:py-20">
          <AdminNav current="orders" />
          <Eyebrow>ADMIN</Eyebrow>
          <h1 className="font-display text-primary leading-display tracking-display mt-3 text-3xl md:text-4xl">
            주문 관리
          </h1>
          <p className="text-secondary mt-4 max-w-[60ch] text-sm leading-relaxed">
            결제가 끝나 제작을 기다리는 주문이 먼저 보입니다. 주문을 열어 제작 시작 · 발송(송장) ·
            배송 완료 · 취소/환불을 처리합니다.
          </p>

          <div className="mt-12">
            <AdminOrderList />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
