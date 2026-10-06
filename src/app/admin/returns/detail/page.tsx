import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminReturnDetail } from "@/components/admin/AdminReturnDetail";

/** 관리자 교환·반품 상세 · 처리. `?id=` 신청 번호 — 정적 내보내기라 동적 경로 대신 쿼리다. */
export const metadata: Metadata = {
  title: "교환 · 반품 상세",
  robots: { index: false, follow: false },
};

export default function AdminReturnDetailPage() {
  return (
    <AdminPage>
      <AdminReturnDetail />
    </AdminPage>
  );
}
