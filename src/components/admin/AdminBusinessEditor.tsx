"use client";

import { CheckCircle, Warning } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

import { ErrorNotice } from "@/components/admin/AdminProductList";
import { adminSiteBusiness, saveSiteBusiness, type SiteBusiness } from "@/lib/console";
import { SHOP_CONNECTED, ShopError } from "@/lib/shop";

/**
 * 푸터 사업자 정보 편집 — 아홉 칸 한 번에 저장.
 *
 * 전자상거래법 제10조 표기 항목이고 PG · 카드사 심사가 사업자등록증과 대조한다. 그래서 칸마다 무엇을 어떻게 적는지
 * 바로 아래에 적어 두고, 저장 전에 손님 화면에 나갈 모양을 오른쪽에 그대로 보여 준다.
 * 길이 · 형식은 서버(V31 CHECK · SiteBusinessController)와 같다.
 */

type State = { kind: "loading" } | { kind: "error"; code: string; message: string } | { kind: "ready" };

const FIELDS: { key: keyof SiteBusiness; label: string; hint: string; max: number; type?: string }[] = [
  { key: "companyName", label: "상호", hint: "사업자등록증의 상호 그대로", max: 100 },
  { key: "representative", label: "대표자", hint: "사업자등록증의 대표자 이름", max: 50 },
  { key: "registrationNumber", label: "사업자등록번호", hint: "000-00-00000 형식 — 공정위 사업자정보 확인 링크도 이 번호로 만듭니다", max: 12 },
  { key: "mailOrderNumber", label: "통신판매업 신고번호", hint: "신고증의 번호 그대로 (예: 2024-수원영통-0059)", max: 50 },
  { key: "address", label: "사업장 주소", hint: "사업자등록증의 주소 그대로 — 반품 받는 곳이 다르면 함께", max: 200 },
  { key: "phone", label: "대표 전화", hint: "여럿이면 · 로 나눕니다", max: 100 },
  { key: "email", label: "이메일", hint: "손님 문의를 받는 주소", max: 254, type: "email" },
  { key: "privacyOfficer", label: "개인정보 보호책임자", hint: "이름 (직함) — 따로 없으면 대표자", max: 100 },
  { key: "hosting", label: "호스팅 서비스 제공자", hint: "서버를 옮기지 않으면 그대로 둡니다", max: 100 },
];

const EMPTY: SiteBusiness = {
  companyName: "",
  representative: "",
  registrationNumber: "",
  mailOrderNumber: "",
  address: "",
  phone: "",
  email: "",
  privacyOfficer: "",
  hosting: "",
};

export function AdminBusinessEditor() {
  const [state, setState] = useState<State>(
    SHOP_CONNECTED ? { kind: "loading" } : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );
  const [form, setForm] = useState<SiteBusiness>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    adminSiteBusiness()
      .then((v) => {
        if (!alive) return;
        setForm(v);
        setState({ kind: "ready" });
      })
      .catch((e) => {
        if (!alive) return;
        const code = e instanceof ShopError ? (e.status === 401 ? "UNAUTHENTICATED" : e.status === 403 ? "FORBIDDEN" : e.code) : "UNKNOWN";
        setState({ kind: "error", code, message: e instanceof ShopError ? e.message : "불러오지 못했습니다." });
      });
    return () => {
      alive = false;
    };
  }, []);

  if (state.kind === "loading") return <p aria-busy="true" className="text-muted text-sm">불러오는 중</p>;
  if (state.kind === "error") return <ErrorNotice code={state.code} message={state.message} />;

  const trimmed = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])) as unknown as SiteBusiness;
  const problems: Partial<Record<keyof SiteBusiness, string>> = {};
  for (const f of FIELDS) if (!trimmed[f.key]) problems[f.key] = `${f.label}을(를) 적어 주세요.`;
  if (trimmed.registrationNumber && !/^[0-9]{3}-[0-9]{2}-[0-9]{5}$/.test(trimmed.registrationNumber)) {
    problems.registrationNumber = "000-00-00000 형식으로 적어 주세요.";
  }
  if (trimmed.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed.email)) problems.email = "이메일 주소 형식을 확인해 주세요.";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    if (Object.keys(problems).length > 0) {
      setResult({ tone: "error", text: "빨간 칸을 고쳐 주세요." });
      return;
    }
    setBusy(true);
    try {
      setForm(await saveSiteBusiness(trimmed));
      setResult({ tone: "ok", text: "저장했습니다. 손님 화면은 1~2분 뒤에 바뀝니다." });
    } catch (err) {
      setResult({ tone: "error", text: err instanceof ShopError ? err.message : "저장하지 못했습니다." });
    } finally {
      setBusy(false);
    }
  }

  const field = "border-interactive focus-visible:border-accent text-primary min-h-12 rounded-xl border bg-transparent px-4 text-sm";

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="grid gap-5 md:grid-cols-2">
          {FIELDS.map((f) => {
            const problem = result?.tone === "error" ? problems[f.key] : undefined;
            return (
              <div key={f.key} className={`flex flex-col gap-1.5 ${f.key === "address" ? "md:col-span-2" : ""}`}>
                <label htmlFor={`biz-${f.key}`} className="text-secondary text-2xs">{f.label}</label>
                <input
                  id={`biz-${f.key}`}
                  type={f.type ?? "text"}
                  value={form[f.key]}
                  maxLength={f.max}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  aria-invalid={problem ? true : undefined}
                  aria-describedby={`biz-${f.key}-hint`}
                  className={`${field} ${problem ? "border-error" : ""}`}
                />
                <p id={`biz-${f.key}-hint`} className={`text-2xs ${problem ? "text-error" : "text-muted"}`}>{problem ?? f.hint}</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={busy}
            className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 items-center rounded-full px-8 text-sm transition-colors duration-300 disabled:opacity-60">
            {busy ? "저장하는 중" : "저장"}
          </button>
          {result && (
            <p role={result.tone === "error" ? "alert" : "status"}
              className={`text-2xs flex gap-1.5 leading-relaxed ${result.tone === "ok" ? "text-success" : "text-error"}`}>
              {result.tone === "ok"
                ? <CheckCircle size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />
                : <Warning size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />}
              <span>{result.text}</span>
            </p>
          )}
        </div>
      </div>

      {/* 미리보기 — 손님 화면 푸터에 나갈 모양 그대로 */}
      <aside className="h-fit lg:sticky lg:top-24">
        <p className="text-muted text-2xs">미리보기 · 손님 화면 맨 아래</p>
        <dl className="bg-band border-subtle mt-3 flex flex-col gap-2.5 rounded-2xl border p-6">
          {FIELDS.map((f) => (
            <div key={f.key} className="text-2xs flex gap-2.5">
              <dt className="text-muted w-28 shrink-0">{f.label}</dt>
              <dd className={form[f.key].trim() ? "text-secondary" : "text-error"}>
                {form[f.key].trim() || "비어 있음"}
                {f.key === "mailOrderNumber" && <span className="text-accent ml-2 underline underline-offset-4">사업자정보 확인</span>}
              </dd>
            </div>
          ))}
        </dl>
      </aside>
    </form>
  );
}
