"use client";

import { Warning } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ProductForm } from "@/components/admin/ProductForm";
import { ADMIN_CONNECTED, AdminApiError, getProduct, type AdminProductEdit } from "@/lib/admin";

/**
 * 상품 등록 화면의 안쪽 — 주소에 `?from=<상품 id>` 가 있으면 그 상품을 복제해 시작한다(같은 옷 다른 색, 2026-10-13).
 *
 * 폼은 브라우저에서만 그린다(정적 HTML 단계에서는 "불러오는 중"). 새 상품 폼이 이 브라우저에 기억한
 * 지난번 입력값(lib/productDefaults)으로 시작하기 때문이다 — 서버에서 그린 빈 칸과 어긋나지 않게.
 */
export function NewProductForm() {
  /* undefined = 아직 모른다(정적 HTML 단계), null = 복제 아님 */
  const from = useSyncExternalStore<string | null | undefined>(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("from"),
    () => undefined,
  );
  const [source, setSource] = useState<{ id: string; product?: AdminProductEdit; error?: string } | null>(null);

  useEffect(() => {
    if (!from || !ADMIN_CONNECTED) return;
    let alive = true;
    getProduct(from)
      .then((product) => alive && setSource({ id: from, product }))
      .catch(
        (e) =>
          alive &&
          setSource({ id: from, error: e instanceof AdminApiError ? e.message : "복제할 상품을 불러오지 못했습니다." }),
      );
    return () => {
      alive = false;
    };
  }, [from]);

  if (from === undefined || (from && ADMIN_CONNECTED && source?.id !== from)) {
    return (
      <p aria-busy="true" className="text-muted text-sm">
        {from ? "복제할 상품을 불러오는 중" : "불러오는 중"}
      </p>
    );
  }

  if (from && source?.error) {
    return (
      <div className="flex flex-col gap-6">
        <p role="alert" className="text-error text-2xs flex gap-1.5 leading-relaxed">
          <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
          <span>복제할 상품을 불러오지 못해 빈 칸으로 시작합니다. ({source.error})</span>
        </p>
        <ProductForm />
      </div>
    );
  }

  return <ProductForm key={from ?? "new"} copyFrom={source?.product} />;
}
