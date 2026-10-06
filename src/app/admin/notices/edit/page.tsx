import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminNoticeEditor } from "@/components/admin/AdminNoticeEditor";

/** 공지 쓰기 · 고치기. `?id=` 가 있으면 고치기 — 정적 내보내기라 동적 경로 대신 쿼리다. */
export const metadata: Metadata = {
  title: "공지 쓰기",
  robots: { index: false, follow: false },
};

export default function AdminNoticeEditPage() {
  return (
    <AdminPage>
      <AdminNoticeEditor />
    </AdminPage>
  );
}
