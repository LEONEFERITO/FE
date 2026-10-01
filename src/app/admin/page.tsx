import type { Metadata } from "next";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminPage } from "@/components/admin/AdminPage";

/** 관리자 첫 화면 — 대시보드. 접근 제어는 서버가 한다(`/api/admin/**` = ADMIN). */

export const metadata: Metadata = {
  title: "관리자",
  robots: { index: false, follow: false },
};

export default function AdminIndexPage() {
  return (
    <AdminPage section="dashboard" title="대시보드" description="지금 손이 가야 하는 일이 맨 위에 있습니다. 숫자를 누르면 그 목록으로 갑니다.">
      <AdminDashboard />
    </AdminPage>
  );
}
