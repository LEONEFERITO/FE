"use client";

import { ArrowDown, ArrowUp, CheckCircle, Warning } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

import { ErrorNotice } from "@/components/admin/AdminProductList";
import { CATEGORY_NAV } from "@/data/categories";
import { adminCategoryOrder, saveCategoryOrder } from "@/lib/console";
import { SHOP_CONNECTED } from "@/lib/shop";
import type { Category } from "@/types/product";

/**
 * 분류 메뉴 순서 (2026-10-13 대표님 "카테고리 순서도 변경할 수 있냐", 서버 V27).
 *
 * 헤더 메뉴(PC · 모바일)와 제품 목록의 분류 필터가 이 순서로 놓인다. ↑ ↓ 를 누르면 바로 저장되고
 * 손님 화면은 1~3분 뒤에 바뀐다(서버가 화면을 다시 만든다). 분류를 더하거나 빼는 곳은 아니다.
 */

type Load = { kind: "loading" } | { kind: "error"; code: string; message: string } | { kind: "ready" };

const INFO = new Map(CATEGORY_NAV.map((c) => [c.category, c]));

export function AdminCategoryOrder() {
  const [load, setLoad] = useState<Load>(
    SHOP_CONNECTED ? { kind: "loading" } : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );
  const [order, setOrder] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    adminCategoryOrder()
      .then((r) => {
        if (!alive) return;
        setOrder(r.categories.filter((c) => INFO.has(c)));
        setLoad({ kind: "ready" });
      })
      .catch((e) => {
        if (!alive) return;
        const status = (e as { status?: number }).status;
        const code = status === 401 ? "UNAUTHENTICATED" : status === 403 ? "FORBIDDEN" : ((e as { code?: string }).code ?? "UNKNOWN");
        setLoad({ kind: "error", code, message: e instanceof Error ? e.message : "불러오지 못했습니다." });
      });
    return () => {
      alive = false;
    };
  }, []);

  if (load.kind === "loading") return <p aria-busy="true" className="text-muted text-sm">불러오는 중</p>;
  if (load.kind === "error") return <ErrorNotice code={load.code} message={load.message} />;

  async function move(i: number, d: -1 | 1) {
    const next = [...order];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    const before = order;
    setOrder(next);
    setBusy(true);
    setMessage(null);
    try {
      await saveCategoryOrder(next);
      setMessage({ tone: "ok", text: "순서를 바꿨습니다. 손님 화면은 1~3분 뒤에 바뀝니다." });
    } catch (e) {
      setOrder(before);
      setMessage({ tone: "error", text: e instanceof Error && e.message ? e.message : "저장하지 못했습니다." });
    } finally {
      setBusy(false);
    }
  }

  const iconBtn =
    "border-subtle text-secondary hover:border-accent hover:text-accent ease-fluid inline-flex h-10 w-10 items-center justify-center border transition-colors duration-300 disabled:opacity-30";

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <p className="text-secondary text-xs leading-relaxed">
        위에서부터 헤더 메뉴의 왼쪽부터 놓입니다. 모바일 메뉴와 제품 목록의 분류 필터도 같은 순서입니다.
      </p>
      {message && (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={`text-2xs flex gap-1.5 leading-relaxed ${message.tone === "ok" ? "text-success" : "text-error"}`}
        >
          {message.tone === "ok" ? (
            <CheckCircle size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />
          ) : (
            <Warning size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />
          )}
          <span>{message.text}</span>
        </p>
      )}
      <ol className="border-subtle divide-subtle divide-y border">
        {order.map((c, i) => {
          const info = INFO.get(c)!;
          return (
            <li key={c} className="bg-surface flex items-center gap-4 p-4 md:p-5">
              <span className="text-muted text-2xs w-6 shrink-0 text-center tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-primary tracking-label text-sm">{info.label}</span>
                <span className="text-muted text-2xs">{info.description}</span>
              </span>
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`${info.label} 위로`}
                  disabled={i === 0 || busy}
                  onClick={() => move(i, -1)}
                  className={iconBtn}
                >
                  <ArrowUp size={14} weight="light" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`${info.label} 아래로`}
                  disabled={i === order.length - 1 || busy}
                  onClick={() => move(i, 1)}
                  className={iconBtn}
                >
                  <ArrowDown size={14} weight="light" aria-hidden="true" />
                </button>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
