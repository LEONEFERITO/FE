import type { Metadata } from "next";

import { AdminGuideEditor } from "@/components/admin/AdminGuideEditor";
import { AdminPage } from "@/components/admin/AdminPage";

/** 가이드 페이지 "제품별 제작 소요기간" 표 편집 (서버 V42, 2026-10-28). */

export const metadata: Metadata = {
  title: "가이드 · 제작 기간",
  robots: { index: false, follow: false },
};

export default function AdminGuidePage() {
  return (
    <AdminPage
      section="guide"
      title="가이드 · 제작 기간"
      description="가이드 페이지 Made To Order 구간의 «제품별 오더 후, 제작 소요기간» 표입니다. 품목과 기간을 한 줄씩 적습니다. 저장하면 손님 화면을 다시 만듭니다(1~2분). 상품마다의 제작 기간은 상품 관리에서 따로 고칩니다."
    >
      <AdminGuideEditor />
    </AdminPage>
  );
}
