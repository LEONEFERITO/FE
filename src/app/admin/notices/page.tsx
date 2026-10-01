import type { Metadata } from "next";

import { AdminNoticeList } from "@/components/admin/AdminNoticeList";
import { AdminPage } from "@/components/admin/AdminPage";

export const metadata: Metadata = {
  title: "공지 관리",
  robots: { index: false, follow: false },
};

export default function AdminNoticesPage() {
  return (
    <AdminPage section="notices" title="공지" description="공개한 공지는 손님 공지사항 화면에 바로 보입니다. 고정한 공지가 맨 위에 옵니다.">
      <AdminNoticeList />
    </AdminPage>
  );
}
