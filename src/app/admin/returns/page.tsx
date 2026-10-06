import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminReturnList } from "@/components/admin/AdminReturnList";

/** 관리자 교환·반품 목록. 접근 제어는 서버가 한다(`/api/admin/**` = ADMIN). */
export const metadata: Metadata = {
  title: "교환 · 반품 관리",
  robots: { index: false, follow: false },
};

export default function AdminReturnsPage() {
  return (
    <AdminPage title="취소 · 반품 · 교환" description="처리할 신청이 먼저 보입니다. 신청을 열어 승인(회수 안내) → 회수 완료 → 반품 환불 또는 교환 재발송 순서로 처리합니다. 받지 않을 신청은 사유를 적어 거절합니다.">
      <AdminReturnList />
    </AdminPage>
  );
}
