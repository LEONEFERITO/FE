import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminMemberDetail } from "@/components/admin/AdminMemberDetail";

/** 관리자 회원 상세 · 조치. `?id=` 로 회원을 받는다 — 이유는 `AdminMemberDetail` 주석. */
export const metadata: Metadata = {
  title: "회원 상세",
  robots: { index: false, follow: false },
};

export default function AdminMemberDetailPage() {
  return (
    <AdminPage>
      <AdminMemberDetail />
    </AdminPage>
  );
}
