"use client";

import { useEffect, useState } from "react";

import { ErrorNotice } from "@/components/admin/AdminProductList";
import { sizeStats, type SizeStats } from "@/lib/console";
import { SHOP_CONNECTED, ShopError } from "@/lib/shop";

/**
 * 사이즈별 판매 — "어느 사이즈를 더 만들지" 의 근거.
 *
 * 판 수(sold)가 아니라 **남은 수(kept)** 를 굵게 보인다. 교환으로 다른 사이즈로 간 것, 반품된 것을 빼고
 * 교환으로 들어온 것을 더한 값이다. 교환으로 나간 수가 많은 사이즈는 실측표가 어긋났다는 신호라 따로 칠한다.
 * 결제 시각 기준 · 취소 제외 · 교환/반품은 완료된 것만.
 */

type State = { kind: "loading" } | { kind: "error"; code: string; message: string } | { kind: "ready"; s: SizeStats };

const PERIODS = [
  { days: 30, label: "최근 30일" },
  { days: 90, label: "최근 90일" },
  { days: 365, label: "최근 1년" },
  { days: 0, label: "전체" },
];

export function AdminSizeStats() {
  const [days, setDays] = useState(90);
  const [state, setState] = useState<State>(
    SHOP_CONNECTED ? { kind: "loading" } : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    sizeStats(days)
      .then((s) => alive && setState({ kind: "ready", s }))
      .catch((e) => {
        if (!alive) return;
        const code = e instanceof ShopError ? (e.status === 401 ? "UNAUTHENTICATED" : e.status === 403 ? "FORBIDDEN" : e.code) : "UNKNOWN";
        setState({ kind: "error", code, message: e instanceof ShopError ? e.message : "불러오지 못했습니다." });
      });
    return () => {
      alive = false;
    };
  }, [days]);

  return (
    <div className="flex flex-col gap-8">
      <div role="group" aria-label="기간" className="flex flex-wrap gap-2">
        {PERIODS.map((p) => {
          const on = p.days === days;
          return (
            <button key={p.days} type="button" aria-pressed={on} onClick={() => setDays(p.days)}
              className={`ease-fluid inline-flex min-h-11 items-center rounded-full border px-5 text-sm transition-colors duration-300 ${
                on ? "border-accent bg-accent text-on-accent" : "border-interactive text-secondary hover:border-accent hover:text-primary"
              }`}>
              {p.label}
            </button>
          );
        })}
      </div>

      {state.kind === "loading" && <p aria-busy="true" className="text-muted text-sm">불러오는 중</p>}
      {state.kind === "error" && <ErrorNotice code={state.code} message={state.message} />}
      {state.kind === "ready" && (state.s.products.length === 0 ? (
        <div className="border-subtle bg-band/60 rounded-2xl border px-6 py-12 text-center">
          <p className="text-primary text-sm">이 기간에 결제된 주문이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {state.s.products.map((p) => {
            const maxKept = Math.max(1, ...p.sizes.map((s) => s.kept));
            return (
              <section key={p.productId} className="border-subtle bg-surface rounded-2xl border p-6" aria-label={p.productName}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="text-primary text-base font-medium">{p.productName}</h2>
                  <p className="text-secondary text-sm">
                    판매 <b className="text-primary tabular-nums">{p.sold}</b>벌 · 남은 수 <b className="text-primary tabular-nums">{p.kept}</b>벌
                  </p>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-subtle text-muted text-2xs border-b text-left">
                        <th scope="col" className="py-2 pr-4 font-normal">사이즈</th>
                        <th scope="col" className="py-2 pr-4 font-normal">남은 수</th>
                        <th scope="col" className="py-2 pr-4 text-right font-normal">판매</th>
                        <th scope="col" className="py-2 pr-4 text-right font-normal">반품</th>
                        <th scope="col" className="py-2 pr-4 text-right font-normal">교환 나감</th>
                        <th scope="col" className="py-2 text-right font-normal">교환 들어옴</th>
                      </tr>
                    </thead>
                    <tbody className="divide-subtle divide-y">
                      {p.sizes.map((s) => (
                        <tr key={s.size}>
                          <th scope="row" className="text-primary py-2.5 pr-4 text-left font-medium">{s.size}</th>
                          <td className="py-2.5 pr-4">
                            <span className="flex items-center gap-3">
                              <span aria-hidden="true" className="bg-band h-2 w-28 overflow-hidden rounded-full">
                                <span className="bg-accent block h-full rounded-full" style={{ width: `${(Math.max(s.kept, 0) / maxKept) * 100}%` }} />
                              </span>
                              <b className="text-primary tabular-nums">{s.kept}</b>
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-right tabular-nums">{s.sold}</td>
                          <td className="py-2.5 pr-4 text-right tabular-nums">{s.returned}</td>
                          <td className={`py-2.5 pr-4 text-right tabular-nums ${s.exchangedOut > 0 ? "text-error" : ""}`}>{s.exchangedOut}</td>
                          <td className="py-2.5 text-right tabular-nums">{s.exchangedIn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
          <p className="text-muted text-2xs leading-relaxed">
            남은 수 = 판매 − 반품 − 교환 나감 + 교환 들어옴. 결제 시각 기준이며 취소된 주문은 빼고, 교환 · 반품은 완료된 것만 셉니다.
            교환 나감이 많은 사이즈는 실측표나 사이즈 안내를 다시 볼 신호입니다.
          </p>
        </div>
      ))}
    </div>
  );
}
