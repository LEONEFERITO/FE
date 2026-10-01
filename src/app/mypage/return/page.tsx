import type { Metadata } from "next";

import { ReturnRequestForm } from "@/components/shop/ReturnRequestForm";
import { ShopPage } from "@/components/shop/ShopPage";

/** 교환·반품 신청. `?no=` 주문번호 — 정적 내보내기라 동적 경로 대신 쿼리다. */

export const metadata: Metadata = {
  title: "교환 · 반품 신청",
  robots: { index: false, follow: false },
};

export default function ReturnRequestPage() {
  return (
    <ShopPage eyebrow="RETURN" title="교환 · 반품 신청" narrow>
      <ReturnRequestForm />
    </ShopPage>
  );
}
