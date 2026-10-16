import type { Metadata } from "next";

import { AdminAccessLogList } from "@/components/admin/AdminAccessLogList";
import { AdminPage } from "@/components/admin/AdminPage";

/** 관리자 접속 · 열람 기록. 서버가 최고 관리자만 허용한다(`/api/admin/access-logs` = SUPER_ADMIN). */
export const metadata: Metadata = {
  title: "접속 기록",
  robots: { index: false, follow: false },
};

export default function AdminAccessLogsPage() {
  return (
    <AdminPage
      title="접속 기록"
      description="관리자가 관리자 화면에서 한 모든 요청이 남습니다 — 누가 · 언제 · 어느 주문/회원을 · 어디서. 개인정보 접속기록은 1년 이상 보관하며 지우지 않습니다. 최고 관리자만 볼 수 있습니다."
    >
      <AdminAccessLogList />
    </AdminPage>
  );
}
