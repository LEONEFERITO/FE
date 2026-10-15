import type { Metadata } from "next";

import { AdminBusinessEditor } from "@/components/admin/AdminBusinessEditor";
import { AdminPage } from "@/components/admin/AdminPage";

/** 푸터 사업자 정보 편집 — 전자상거래법 제10조 표기 항목. */

export const metadata: Metadata = {
  title: "푸터 · 사업자 정보",
  robots: { index: false, follow: false },
};

export default function AdminBusinessPage() {
  return (
    <AdminPage
      section="display"
      title="푸터 · 사업자 정보"
      description="모든 페이지 맨 아래에 나오는 사업자 정보입니다. 법으로 표시해야 하는 항목이라 사업자등록증과 한 글자도 다르지 않게 적어 주세요. 저장하면 손님 화면을 다시 만듭니다(1~2분)."
    >
      <AdminBusinessEditor />
    </AdminPage>
  );
}
