import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminSizeStats } from "@/components/admin/AdminSizeStats";

/** 관리자 통계 — 사이즈별 판매. */

export const metadata: Metadata = {
  title: "통계",
  robots: { index: false, follow: false },
};

export default function AdminStatsPage() {
  return (
    <AdminPage section="stats" title="사이즈별 판매" description="어느 사이즈를 더 만들지 정하는 근거입니다. 교환·반품을 반영한 '남은 수' 로 봅니다.">
      <AdminSizeStats />
    </AdminPage>
  );
}
