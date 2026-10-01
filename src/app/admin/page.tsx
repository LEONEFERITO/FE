import type { Metadata } from "next";

import { AdminHome } from "@/components/admin/AdminHome";

/**
 * 관리자 첫 화면 — 주문 관리로 보낸다. 관리자가 매일 가장 먼저 여는 곳이 주문이다.
 * 정적 내보내기라 서버 리다이렉트가 없어서, 브라우저에서 옮긴다(링크도 함께 둔다).
 */

export const metadata: Metadata = {
  title: "관리자",
  robots: { index: false, follow: false },
};

export default function AdminIndexPage() {
  return <AdminHome />;
}
