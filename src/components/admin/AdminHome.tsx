"use client";

import Link from "next/link";
import { useEffect } from "react";

/** /admin/ → /admin/orders/. 권한 확인은 위의 AdminGate 가 이미 끝냈다. */
export function AdminHome() {
  useEffect(() => {
    window.location.replace("/admin/orders/");
  }, []);

  return (
    <main id="main" className="on-cream flex-1">
      <div className="mx-auto max-w-[720px] px-5 py-20 md:px-15">
        <p className="text-muted text-sm">
          주문 관리로 이동합니다.{" "}
          <Link href="/admin/orders/" className="text-accent underline underline-offset-4">
            바로 가기
          </Link>
        </p>
      </div>
    </main>
  );
}
