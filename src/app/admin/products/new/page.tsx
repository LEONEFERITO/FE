import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/AdminPage";
import { ProductForm } from "@/components/admin/ProductForm";

/**
 * 상품 등록.
 *
 * ── 이 화면의 접근 제어는 서버가 한다 ───────────────────
 * 정적 내보내기라 이 페이지 자체는 누구나 열 수 있다. 하지만 <b>여기서 하는 모든 요청이
 * ADMIN 권한을 요구</b>하므로, 권한 없는 사람은 화면만 보고 아무것도 못 한다.
 * 화면을 숨기는 것으로 보안을 삼지 않는다 — 그건 주소만 알면 뚫린다.
 *
 * 권한 없는 사람에게는 들어오는 순간 안내가 뜬다(app/admin/layout.tsx · AdminGate). 보안이 아니라 안내다.
 */
export const metadata: Metadata = {
  title: "상품 등록",
  // 관리자 화면은 절대 색인되면 안 된다. 사이트 전체 noindex 를 걷어내도 이건 남는다.
  robots: { index: false, follow: false },
};

export default function AdminNewProductPage() {
  return (
    <AdminPage title="상품 등록" description="이미지는 고르는 즉시 미리보기가 나타납니다. 오른쪽에서 실제 화면에 어떻게 보이는지 PC · 모바일 폭으로 확인할 수 있습니다." back={{ href: "/admin/products/", label: "상품 목록" }}>
      <ProductForm />
    </AdminPage>
  );
}
