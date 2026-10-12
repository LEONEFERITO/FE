import type { Metadata } from "next";

import { AdminHeroEditor } from "@/components/admin/AdminHeroEditor";
import { AdminPage } from "@/components/admin/AdminPage";

export const metadata: Metadata = {
  title: "메인 배너",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AdminPage
      title="메인 배너"
      description="메인 첫 화면의 배너를 무엇으로 채울지 고릅니다. 자동 · 상품 지정 · 직접 올리기 중 하나를 저장하면 1~3분 뒤 손님 화면에 반영됩니다."
    >
      <AdminHeroEditor />
    </AdminPage>
  );
}
