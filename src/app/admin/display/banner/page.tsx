import type { Metadata } from "next";

import { AdminHeroBanners } from "@/components/admin/AdminHeroBanners";
import { AdminPage } from "@/components/admin/AdminPage";

export const metadata: Metadata = {
  title: "메인 배너",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AdminPage
      title="메인 배너"
      description="메인 첫 화면의 배너를 등록합니다. 노출 중인 배너가 위에서부터 순서대로 넘어가고, 저장하면 1~3분 뒤 손님 화면에 반영됩니다."
    >
      <AdminHeroBanners />
    </AdminPage>
  );
}
