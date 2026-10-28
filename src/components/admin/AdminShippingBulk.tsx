"use client";

import { DownloadSimple, FileArrowUp, Warning } from "@phosphor-icons/react/dist/ssr";
import { useId, useRef, useState } from "react";

import { COURIERS } from "@/components/admin/AdminOrderDetail";
import {
  ADMIN_CONNECTED,
  AdminApiError,
  downloadOrderExport,
  importTracking,
  type ImportRowError,
  type TrackingShipped,
} from "@/lib/admin";

/**
 * 발송 일괄 처리 (2026-10-28) — 주문 관리 맨 위.
 *
 *   ① 주문 목록 엑셀 — 보낼 주문(결제 완료 · 제작 중)의 받는 분 · 연락처 · 주소. 택배 프로그램에 올려 송장을 뽑는다.
 *   ② 송장 일괄 입력 — 택배 프로그램이 준 엑셀(주문번호 · 송장번호, 택배사 칸은 있어도 없어도)을 올리면 전부 발송 처리 + 손님 메일.
 *
 * 택배사가 아직 정해지지 않아 일반 양식이다. 한 줄이라도 틀리면 서버가 아무것도 보내지 않고 줄 · 칸 · 이유를 돌려준다.
 */
type State =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "done"; shipped: TrackingShipped[] }
  | { kind: "invalid"; message: string; rows: ImportRowError[] }
  | { kind: "error"; message: string };

export function AdminShippingBulk({ onShipped }: { onShipped?: () => void }) {
  const fileId = useId();
  const picker = useRef<HTMLInputElement>(null);
  const [courier, setCourier] = useState(COURIERS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<State>({ kind: "idle" });
  const [downloading, setDownloading] = useState(false);

  if (!ADMIN_CONNECTED) return null;

  async function download() {
    setDownloading(true);
    try {
      await downloadOrderExport();
    } catch (e) {
      setState({ kind: "error", message: e instanceof AdminApiError ? e.message : "내려받지 못했습니다." });
    } finally {
      setDownloading(false);
    }
  }

  async function upload() {
    if (!file) return;
    setState({ kind: "busy" });
    try {
      setState({ kind: "done", shipped: await importTracking(file, courier) });
      setFile(null);
      onShipped?.();
    } catch (e) {
      if (e instanceof AdminApiError && e.code === "IMPORT_INVALID") {
        setState({ kind: "invalid", message: e.message, rows: e.rows ?? [] });
      } else {
        setState({ kind: "error", message: e instanceof AdminApiError ? e.message : "올리지 못했습니다." });
      }
    }
  }

  const btn =
    "border-interactive text-secondary hover:border-accent hover:text-primary ease-fluid inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm transition-colors duration-300 disabled:opacity-50";

  return (
    <section aria-labelledby="bulk-ship-h" className="border-subtle bg-band/60 mb-8 flex flex-col gap-5 rounded-2xl border px-5 py-5 md:px-7">
      <div>
        <h2 id="bulk-ship-h" className="text-primary text-sm font-medium">
          발송 일괄 처리
        </h2>
        <p className="text-muted text-2xs mt-1 leading-relaxed">
          ① 주문 목록 엑셀을 내려받아 택배 프로그램에 올리고 → ② 택배 프로그램이 준 송장 엑셀(주문번호 · 송장번호)을 아래에 올리면 전부 발송
          처리되고 손님에게 송장 메일이 갑니다.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={download} disabled={downloading} className={btn}>
          <DownloadSimple size={16} weight="light" aria-hidden="true" />
          {downloading ? "받는 중" : "① 보낼 주문 엑셀 내려받기"}
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-secondary text-2xs">택배사 (파일에 택배사 칸이 없을 때)</span>
          <select
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            className="border-interactive text-primary min-h-11 rounded-xl border bg-transparent px-3 text-sm"
          >
            {COURIERS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={fileId} className="text-secondary text-2xs">
            송장 엑셀 (.xlsx · CSV)
          </label>
          <input
            id={fileId}
            ref={picker}
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setState({ kind: "idle" });
            }}
            className="text-secondary file:border-interactive file:text-secondary min-h-11 text-sm file:mr-3 file:rounded-full file:border file:bg-transparent file:px-4 file:py-2"
          />
        </div>
        <button
          type="button"
          onClick={upload}
          disabled={!file || state.kind === "busy"}
          className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileArrowUp size={16} weight="light" aria-hidden="true" />
          {state.kind === "busy" ? "처리하는 중" : "② 올려서 발송 처리"}
        </button>
      </div>

      {state.kind === "error" && (
        <p role="alert" className="text-error text-sm">
          {state.message}
        </p>
      )}

      {state.kind === "invalid" && (
        <div role="alert" className="border-error/40 rounded-xl border px-4 py-4">
          <p className="text-error flex items-center gap-2 text-sm font-medium">
            <Warning size={16} weight="light" aria-hidden="true" />
            {state.message} 아무것도 발송 처리하지 않았습니다.
          </p>
          <ul className="divide-subtle mt-3 divide-y text-sm">
            {state.rows.map((r, i) => (
              <li key={i} className="flex flex-col gap-1 py-2 md:flex-row md:gap-6">
                <span className="text-primary w-36 shrink-0 tabular-nums">{r.field}</span>
                <span className="text-secondary">{r.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.kind === "done" && (
        <div role="status" className="border-subtle rounded-xl border bg-white px-4 py-4">
          <p className="text-primary text-sm font-medium">{state.shipped.length}건을 발송 처리하고 손님에게 송장 메일을 보냈습니다.</p>
          <ul className="divide-subtle mt-3 divide-y text-sm">
            {state.shipped.map((s) => (
              <li key={s.orderNumber} className="flex flex-wrap gap-x-4 py-2">
                <span className="text-muted tabular-nums">{s.row}행</span>
                <span className="text-primary tabular-nums">{s.orderNumber}</span>
                <span className="text-secondary">
                  {s.courier} {s.trackingNumber}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
