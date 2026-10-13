import type { Metadata } from "next";

import { AdminCategoryOrder } from "@/components/admin/AdminCategoryOrder";
import { AdminPage } from "@/components/admin/AdminPage";

/** 분류 메뉴 순서 — 헤더 · 모바일 메뉴 · 제품 목록 필터 (서버 V27). */

export const metadata: Metadata = {
  title: "분류 순서",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AdminPage
      title="분류 순서"
      description="헤더 메뉴의 분류(SHIRTS · TROUSERS · JACKET …) 순서를 바꿉니다. 바꾸면 바로 저장되고 1~3분 뒤 손님 화면에 반영됩니다."
    >
      <AdminCategoryOrder />
    </AdminPage>
  );
}
