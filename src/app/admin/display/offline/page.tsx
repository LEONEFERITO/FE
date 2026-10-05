import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminSiteImageEditor } from "@/components/admin/AdminSiteImageEditor";

/** 매장 사진 편집 — 메인 OFFLINE SHOP 구간의 왼쪽 사진. */

export const metadata: Metadata = {
  title: "매장 사진",
  robots: { index: false, follow: false },
};

export default function AdminOfflineShopPage() {
  return (
    <AdminPage
      section="display"
      title="매장 사진"
      description="메인의 OFFLINE SHOP 구간에 들어가는 사진입니다. 올리고 저장하면 손님 화면을 다시 만듭니다(1~2분). 사진이 없으면 기본 사진이 나갑니다."
    >
      <AdminSiteImageEditor />
    </AdminPage>
  );
}
