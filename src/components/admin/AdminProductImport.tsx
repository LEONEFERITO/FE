"use client";

import { DownloadSimple, FileArrowUp, FileCsv, FolderOpen, Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useId, useRef, useState } from "react";

import {
  ADMIN_CONNECTED,
  AdminApiError,
  downloadImportTemplate,
  importProducts,
  type ImportCreated,
  type ImportRowError,
} from "@/lib/admin";

/**
 * 상품 일괄 등록 (2026-10-16 "엑셀로 한번에") — 양식을 내려받아 엑셀에서 채우고, CSV 로 저장해 올린다.
 * 한 줄이라도 틀리면 서버가 아무것도 저장하지 않고 줄 · 칸 · 이유를 전부 돌려준다 — 그 목록을 그대로 보여 준다.
 * 맞으면 전부 초안으로 생기고, 만든 상품 목록에서 하나씩 열어 사진을 붙이고 공개한다.
 */
type State =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "done"; created: ImportCreated[] }
  | { kind: "invalid"; message: string; rows: ImportRowError[] }
  | { kind: "error"; message: string };

export function AdminProductImport() {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<State>({ kind: "idle" });
  const [downloading, setDownloading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  /** 고른 · 끌어다 놓은 파일 — CSV 가 아니면 바로 알려 준다(엑셀 .xlsx 를 그대로 올리는 실수가 가장 흔하다) */
  function choose(f: File | undefined) {
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) {
      setFile(null);
      setState({
        kind: "error",
        message: f.name.match(/\.xlsx?$/i)
          ? "엑셀 파일(.xlsx)은 바로 올릴 수 없습니다. 엑셀에서 '다른 이름으로 저장 → CSV' 로 저장한 파일을 올려 주세요."
          : "CSV 파일(.csv)만 올릴 수 있습니다.",
      });
      return;
    }
    setFile(f);
    setState({ kind: "idle" });
  }

  async function template() {
    setDownloading(true);
    try {
      await downloadImportTemplate();
    } catch (e) {
      setState({ kind: "error", message: e instanceof AdminApiError ? e.message : "양식을 받지 못했습니다." });
    } finally {
      setDownloading(false);
    }
  }

  async function upload() {
    if (!file) return;
    setState({ kind: "uploading" });
    try {
      setState({ kind: "done", created: await importProducts(file) });
      setFile(null);
    } catch (e) {
      if (e instanceof AdminApiError && e.code === "IMPORT_INVALID") {
        setState({ kind: "invalid", message: e.message, rows: e.rows ?? [] });
      } else {
        setState({ kind: "error", message: e instanceof AdminApiError ? e.message : "올리지 못했습니다." });
      }
    }
  }

  if (!ADMIN_CONNECTED) {
    return <p className="text-muted text-sm">서버가 아직 연결되지 않았습니다.</p>;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <ol className="text-secondary flex flex-col gap-2 text-sm leading-relaxed">
        <li>
          <b className="text-primary">1.</b> 양식을 내려받아 엑셀에서 엽니다. 예시 두 줄은 지우고 한 줄에 상품 하나씩 적습니다.
        </li>
        <li>
          <b className="text-primary">2.</b> <b>분류</b>는 수트 · 재킷 · 트라우저 · 셔츠 · 신발 · 액세서리, <b>라인</b>은 레오네 · 페리토.
          <b> 사이즈</b>는 <code>95/100/105</code> 처럼 빗금으로 나눕니다. <b>주소</b>는 비우면 자동으로 만듭니다.
        </li>
        <li>
          <b className="text-primary">3.</b> 엑셀에서 <b>다른 이름으로 저장 → CSV</b> (CSV UTF-8 또는 CSV 쉼표로 분리 둘 다 됩니다).
        </li>
        <li>
          <b className="text-primary">4.</b> 아래에서 올립니다. 모두 <b>초안</b>으로 생기고, 사진은 상품마다 수정 화면에서 붙여 공개합니다.
        </li>
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={template}
          disabled={downloading}
          className="border-interactive text-secondary hover:border-accent hover:text-primary ease-fluid inline-flex min-h-12 items-center gap-2 rounded-full border px-6 text-sm transition-colors duration-300 disabled:opacity-60"
        >
          <DownloadSimple size={16} weight="light" aria-hidden="true" />
          {downloading ? "받는 중" : "양식 내려받기"}
        </button>
      </div>

      {/* 끌어다 놓기 상자 — 상자 아무 데나 눌러도 파일 찾기 창이 열린다 */}
      <div className="flex flex-col gap-4">
        <div
          role="button"
          tabIndex={0}
          aria-describedby={`${inputId}-hint`}
          onClick={() => picker.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              picker.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            choose(e.dataTransfer.files?.[0]);
          }}
          className={`ease-fluid flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-300 ${
            dragging ? "border-accent bg-accent-tint" : file ? "border-accent/60 bg-band/60" : "border-interactive/60 hover:border-accent bg-band/40"
          }`}
        >
          {file ? (
            <>
              <FileCsv size={36} weight="light" aria-hidden="true" className="text-accent" />
              <p className="text-primary text-sm font-medium break-all">{file.name}</p>
              <p className="text-muted text-2xs">{(file.size / 1024).toFixed(1)}KB · 다른 파일로 바꾸려면 다시 누르거나 끌어다 놓으세요</p>
            </>
          ) : (
            <>
              <FolderOpen size={36} weight="light" aria-hidden="true" className="text-secondary" />
              <p className="text-primary text-sm font-medium">CSV 파일을 여기로 끌어다 놓으세요</p>
              <p id={`${inputId}-hint`} className="text-muted text-2xs">
                또는 <span className="text-accent underline underline-offset-4">파일 찾기</span> — 엑셀에서 CSV 로 저장한 파일
              </p>
            </>
          )}
          <input
            id={inputId}
            ref={picker}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              choose(e.target.files?.[0]);
              e.target.value = ""; // 같은 파일을 고쳐서 다시 골라도 바뀐 것으로 받게
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => picker.current?.click()}
            className="border-interactive text-secondary hover:border-accent hover:text-primary ease-fluid inline-flex min-h-12 items-center gap-2 rounded-full border px-6 text-sm transition-colors duration-300"
          >
            <FolderOpen size={16} weight="light" aria-hidden="true" />
            파일 찾기
          </button>
          <button
            type="button"
            onClick={upload}
            disabled={!file || state.kind === "uploading"}
            className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileArrowUp size={16} weight="light" aria-hidden="true" />
            {state.kind === "uploading" ? "올리는 중" : "올려서 초안 만들기"}
          </button>
        </div>
      </div>

      {state.kind === "error" && (
        <p role="alert" className="text-error text-sm">
          {state.message}
        </p>
      )}

      {state.kind === "invalid" && (
        <section role="alert" aria-labelledby="import-errors" className="border-error/40 rounded-2xl border px-5 py-5 md:px-7">
          <h2 id="import-errors" className="text-error flex items-center gap-2 text-sm font-medium">
            <Warning size={16} weight="light" aria-hidden="true" />
            {state.message}
          </h2>
          <ul className="divide-subtle mt-4 divide-y text-sm">
            {state.rows.map((r, i) => (
              <li key={i} className="flex flex-col gap-1 py-2.5 md:flex-row md:gap-6">
                <span className="text-primary w-40 shrink-0 tabular-nums">{r.field}</span>
                <span className="text-secondary">{r.message}</span>
              </li>
            ))}
          </ul>
          <p className="text-muted text-2xs mt-4">엑셀에서 고친 뒤 다시 저장해 올리세요. 줄 번호는 엑셀 왼쪽의 줄 번호와 같습니다.</p>
        </section>
      )}

      {state.kind === "done" && (
        <section role="status" aria-labelledby="import-done" className="border-subtle rounded-2xl border px-5 py-5 md:px-7">
          <h2 id="import-done" className="text-primary text-sm font-medium">
            {state.created.length}개를 초안으로 만들었습니다. 하나씩 열어 사진을 붙이고 공개하세요.
          </h2>
          <ul className="divide-subtle mt-4 divide-y text-sm">
            {state.created.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 py-2.5">
                <span className="text-secondary">
                  <span className="text-muted mr-3 tabular-nums">{c.row}행</span>
                  {c.name}
                </span>
                <Link href={`/admin/products/edit?id=${encodeURIComponent(c.id)}`} className="text-accent shrink-0 text-xs underline underline-offset-4">
                  열기
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
