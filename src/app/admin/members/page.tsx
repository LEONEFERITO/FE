import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminMemberList } from "@/components/admin/AdminMemberList";

/**
 * 관리자 회원 목록. 접근 제어는 서버가 한다(`/api/admin/**` = ADMIN).
 */
export const metadata: Metadata = {
  title: "회원 관리",
  robots: { index: false, follow: false },
};

export default function AdminMembersPage() {
  return (
    <AdminPage title="회원 관리" description="최근 가입한 회원이 위로 옵니다. 목록에서는 전화번호가 가려져 있고, 상세를 열면 보입니다. 상세를 연 기록은 남습니다.">
      <AdminMemberList />
    </AdminPage>
  );
}
