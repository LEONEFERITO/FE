import type { Metadata } from "next";

import { OrderDetailView } from "@/components/shop/OrderDetailView";
import { ShopPage } from "@/components/shop/ShopPage";

/** 주문 상세. `?no=` 주문번호 — 정적 내보내기라 동적 경로 대신 쿼리다. */

export const metadata: Metadata = {
  title: "주문 상세",
  robots: { index: false, follow: false },
};

export default function MyOrderPage() {
  return (
    <ShopPage eyebrow="ORDER" title="주문 상세" narrow>
      <OrderDetailView />
    </ShopPage>
  );
}
