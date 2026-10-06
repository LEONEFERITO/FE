import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminProductEditor } from "@/components/admin/AdminProductEditor";

/**
 * 상품 수정 · 공개. `?id=` 로 상품을 받는다 — 이유는 `AdminProductEditor` 주석.
 * 머리(뒤로가기 · 표시 · 제목)는 상품 이름이 들어가므로 편집기가 그린다.
 */
export const metadata: Metadata = {
  title: "상품 수정",
  robots: { index: false, follow: false },
};

export default function AdminEditProductPage() {
  return (
    <AdminPage>
      <AdminProductEditor />
    </AdminPage>
  );
}
