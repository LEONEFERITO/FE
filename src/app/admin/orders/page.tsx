import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminOrderList } from "@/components/admin/AdminOrderList";

/** 관리자 주문 목록. 접근 제어는 서버가 한다(`/api/admin/**` = ADMIN). */
export const metadata: Metadata = {
  title: "주문 관리",
  robots: { index: false, follow: false },
};

export default function AdminOrdersPage() {
  return (
    <AdminPage title="주문 관리" description="결제가 끝나 제작을 기다리는 주문이 먼저 보입니다. 주문을 열어 제작 시작 · 발송(송장) · 배송 완료 · 취소/환불을 처리합니다.">
      <AdminOrderList />
    </AdminPage>
  );
}
