import type { Metadata } from "next";

import { AdminDisplayOrder } from "@/components/admin/AdminDisplayOrder";
import { AdminPage } from "@/components/admin/AdminPage";

export const metadata: Metadata = {
  title: "메인 구성",
  robots: { index: false, follow: false },
};

export default function AdminDisplayPage() {
  return (
    <AdminPage
      section="display"
      title="메인 구성 · 진열 순서"
      description="공개 상품을 손님에게 보일 순서로 놓습니다. 메인 첫 화면에는 대표 사진이 있는 앞의 4개가, 제품 목록에는 이 순서대로 나옵니다."
    >
      <AdminDisplayOrder />
    </AdminPage>
  );
}
