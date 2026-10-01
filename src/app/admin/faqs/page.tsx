import type { Metadata } from "next";

import { AdminFaqManager } from "@/components/admin/AdminFaqManager";
import { AdminPage } from "@/components/admin/AdminPage";

export const metadata: Metadata = {
  title: "FAQ 관리",
  robots: { index: false, follow: false },
};

export default function AdminFaqsPage() {
  return (
    <AdminPage section="faqs" title="자주 묻는 질문" description="손님 QnA 화면에 이 순서대로 나옵니다. 숨긴 질문은 손님에게 보이지 않습니다.">
      <AdminFaqManager />
    </AdminPage>
  );
}
