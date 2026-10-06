import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminProductList } from "@/components/admin/AdminProductList";

/**
 * 관리자 상품 목록.
 *
 * 접근 제어는 서버가 한다(`/api/admin/**` = ADMIN). 이 페이지는 누구나 열 수 있지만
 * 권한이 없으면 목록 요청이 401/403 으로 돌아오고, 화면은 그 이유를 안내한다.
 */
export const metadata: Metadata = {
  title: "상품 관리",
  robots: { index: false, follow: false },
};

export default function AdminProductsPage() {
  return (
    <AdminPage title="상품 관리" description="초안과 공개 상품이 함께 나옵니다. 최근에 고친 상품이 위로 옵니다. 공개하려면 무엇이 더 필요한지 줄마다 적혀 있습니다.">
      <AdminProductList />
    </AdminPage>
  );
}
