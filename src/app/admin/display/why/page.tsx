import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminWhyEditor } from "@/components/admin/AdminWhyEditor";

/** 메인 WHY 구간 편집 — 제목 · 소개 · 항목(제목 · 설명 · 배경 사진). */

export const metadata: Metadata = {
  title: "메인 WHY 구간",
  robots: { index: false, follow: false },
};

export default function AdminWhyPage() {
  return (
    <AdminPage
      section="display"
      title="메인 WHY 구간"
      description="메인에서 화면을 붙잡아 두고 스크롤로 넘기는 구간입니다. 항목이 켜질 때 그 항목의 배경 사진으로 바뀝니다. 저장하면 손님 화면을 다시 만듭니다(1~2분)."
    >
      <AdminWhyEditor />
    </AdminPage>
  );
}
