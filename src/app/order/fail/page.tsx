import type { Metadata } from "next";

import { PaymentFail } from "@/components/shop/PaymentResult";
import { ShopPage } from "@/components/shop/ShopPage";

/** 결제 미완료 화면. 결제가 거절됐거나 확인하지 못한 경우 — 돈은 움직이지 않았다. */

export const metadata: Metadata = {
  title: "결제 미완료",
  robots: { index: false, follow: false },
};

export default function OrderFailPage() {
  return (
    <ShopPage eyebrow="ORDER" title="결제가 완료되지 않았습니다" narrow>
      <PaymentFail />
    </ShopPage>
  );
}
