import type { Metadata } from "next";

import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { ShopPage } from "@/components/shop/ShopPage";

/** 주문서. `?items=` 로 장바구니 줄을 받는다(바로 구매는 한 줄). */

export const metadata: Metadata = {
  title: "주문서",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <ShopPage eyebrow="CHECKOUT" title="주문서" description="받으실 곳을 확인하고 결제해 주세요.">
      <CheckoutForm />
    </ShopPage>
  );
}
