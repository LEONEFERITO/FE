import type { Metadata } from "next";

import { PaymentFail } from "@/components/shop/PaymentResult";
import { ShopPage } from "@/components/shop/ShopPage";

/** 토스 결제창 failUrl. 결제창을 닫았거나 결제가 거절된 경우. */

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
