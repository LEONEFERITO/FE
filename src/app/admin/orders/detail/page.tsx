import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminOrderDetail } from "@/components/admin/AdminOrderDetail";

/** 관리자 주문 상세 · 처리. `?no=` 주문번호 — 정적 내보내기라 동적 경로 대신 쿼리다. */
export const metadata: Metadata = {
  title: "주문 상세",
  robots: { index: false, follow: false },
};

export default function AdminOrderDetailPage() {
  return (
    <AdminPage>
      <AdminOrderDetail />
    </AdminPage>
  );
}
