import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminProductImport } from "@/components/admin/AdminProductImport";

/** 상품 일괄 등록 — 엑셀(CSV). 접근 제어는 서버가 한다(`/api/admin/**` = ADMIN). */
export const metadata: Metadata = {
  title: "엑셀로 한번에 등록",
  robots: { index: false, follow: false },
};

export default function AdminProductImportPage() {
  return (
    <AdminPage
      title="엑셀로 한번에 등록"
      description="여러 상품을 엑셀 한 장으로 등록합니다. 한 줄이라도 틀리면 아무것도 저장하지 않고, 몇 번째 줄의 어느 칸이 왜 틀렸는지 보여 줍니다."
    >
      <AdminProductImport />
    </AdminPage>
  );
}
