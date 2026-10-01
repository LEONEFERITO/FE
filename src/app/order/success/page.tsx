import type { Metadata } from "next";

import { PaymentSuccess } from "@/components/shop/PaymentResult";
import { ShopPage } from "@/components/shop/ShopPage";

/** 토스 결제창 successUrl. 서버에 승인을 요청하고 결과를 보여 준다. */

export const metadata: Metadata = {
  title: "결제 완료",
  robots: { index: false, follow: false },
  // 주소에 결제 키가 붙어 온다. 다른 곳으로 나가는 요청에 따라가지 않게.
  referrer: "no-referrer",
};

export default function OrderSuccessPage() {
  return (
    <ShopPage eyebrow="ORDER" title="주문 완료" narrow>
      <PaymentSuccess />
    </ShopPage>
  );
}
