"use client";

import { Plus, Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";

import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  ADMIN_CONNECTED,
  AdminApiError,
  STATUS_LABEL,
  listProducts,
  missingLabel,
  type AdminProductRow,
  type ProductStatus,
} from "@/lib/admin";
import { CATEGORY_LABEL, LINE_LABEL, type Category, type ProductLine } from "@/types/product";

/**
 * 관리자 상품 목록.
 *
 * ── 초안이 먼저 보여야 한다 ─────────────────────────────
 * 공개 목록과 달리 초안이 섞여 나온다. 관리자가 여기 오는 이유는 대부분
 * "만들다 만 것" 을 이어서 고치려는 것이다. 서버가 최근 수정순으로 준다.
 *
 * ── 왜 공개가 안 되는지를 줄마다 적는다 ─────────────────
 * 눌러 들어가서 공개 버튼을 눌러 보고서야 "대표 이미지가 없습니다" 를 듣게 하지 않는다.
 * 모자란 항목을 목록에서 바로 보여준다. 기준은 서버가 준다(`missingForPublish`) —
 * 화면이 규칙을 따로 들고 있으면 서버가 조건을 바꾸는 날 둘이 어긋난다.
 *
 * ── 거르기는 화면에서 ──────────────────────────────────
 * 상품이 수십 점이라 한 번 받아 두고 탭만 바꾼다. 탭 전환에 요청이 없으니 즉시 바뀐다.
 */

type Tab = "ALL" | ProductStatus;

const TABS: { key: Tab; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "DRAFT", label: STATUS_LABEL.DRAFT },
  { key: "PUBLISHED", label: STATUS_LABEL.PUBLISHED },
];

type State =
  | { kind: "loading" }
  | { kind: "error"; code: string; message: string }
  | { kind: "ready"; rows: AdminProductRow[] };

const won = new Intl.NumberFormat("ko-KR");
const when = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function AdminProductList() {
  const [state, setState] = useState<State>(
    ADMIN_CONNECTED
      ? { kind: "loading" }
      : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );
  const [tab, setTab] = useState<Tab>("ALL");

  useEffect(() => {
    if (!ADMIN_CONNECTED) return;
    let alive = true;
    listProducts()
      .then((rows) => alive && setState({ kind: "ready", rows }))
      .catch((e) => {
        if (!alive) return;
        setState(
          e instanceof AdminApiError
            ? { kind: "error", code: e.code, message: e.message }
            : { kind: "error", code: "UNKNOWN", message: "목록을 불러오지 못했습니다." },
        );
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        {state.kind === "ready" ? (
          <Tabs rows={state.rows} tab={tab} onChange={setTab} />
        ) : (
          <span />
        )}

        <Link
          href="/admin/products/new"
          className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm transition-colors duration-300"
        >
          <Plus size={16} weight="light" aria-hidden="true" />새 상품 등록
        </Link>
      </div>

      {state.kind === "loading" && <Skeleton />}
      {state.kind === "error" && <ErrorNotice code={state.code} message={state.message} />}
      {state.kind === "ready" && (
        <Rows rows={state.rows.filter((r) => tab === "ALL" || r.status === tab)} tab={tab} />
      )}
    </div>
  );
}

function Tabs({
  rows,
  tab,
  onChange,
}: {
  rows: AdminProductRow[];
  tab: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    /*
      탭이지만 tablist 로 만들지 않는다. tablist 는 화살표 키 이동과 tabpanel 연결까지
      약속하는데, 이건 같은 목록을 거르는 버튼 묶음이다. aria-pressed 가 정확한 이름이다.
    */
    <div role="group" aria-label="상태로 거르기" className="flex flex-wrap gap-2">
      {TABS.map((t) => {
        const count = t.key === "ALL" ? rows.length : rows.filter((r) => r.status === t.key).length;
        const on = tab === t.key;
        return (
          <button
            key={t.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(t.key)}
            className={`ease-fluid inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm transition-colors duration-300 ${
              on
                ? "border-accent bg-accent text-on-accent"
                : "border-interactive text-secondary hover:border-accent hover:text-primary"
            }`}
          >
            {t.label}
            <span className="tabular-nums opacity-80">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

function Rows({ rows, tab }: { rows: AdminProductRow[]; tab: Tab }) {
  if (rows.length === 0) {
    return (
      <div className="border-subtle bg-band/60 rounded-2xl border px-6 py-12 text-center">
        <p className="text-primary text-sm">
          {tab === "ALL"
            ? "등록된 상품이 없습니다."
            : `${STATUS_LABEL[tab as ProductStatus]} 상태인 상품이 없습니다.`}
        </p>
        {tab === "ALL" && (
          <p className="text-muted text-2xs mt-2 leading-relaxed">
            &lsquo;새 상품 등록&rsquo; 으로 시작하세요.
          </p>
        )}
      </div>
    );
  }

  return (
    <ul className="border-subtle divide-subtle divide-y border-y">
      {rows.map((r) => (
        <li key={r.id}>
          {/*
            줄 전체가 하나의 링크다. 이름만 링크로 두면 누를 곳이 좁고,
            줄 안에 버튼을 여럿 두면 공개처럼 되돌리기 번거로운 동작이 실수로 눌린다.
            공개·비공개는 편집 화면 안에서만 한다.
          */}
          <Link
            href={`/admin/products/edit?id=${encodeURIComponent(r.id)}`}
            className="group hover:bg-band/60 ease-fluid flex min-w-0 items-start gap-4 px-1 py-5 transition-colors duration-300 md:items-center md:gap-6 md:px-3"
          >
            <div className="border-subtle bg-band/60 relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-lg border md:w-16">
              {r.mainImageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={r.mainImageUrl}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-muted text-2xs absolute inset-0 flex items-center justify-center">
                  없음
                </span>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:grid md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:gap-6">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span
                    className={`group-hover:text-accent ease-fluid text-sm transition-colors duration-300 ${
                      r.name ? "text-primary" : "text-muted"
                    }`}
                  >
                    {r.name ?? "이름 없음"}
                  </span>
                  <StatusBadge status={r.status} />
                </p>
                <p className="text-muted text-2xs mt-1 truncate">
                  {CATEGORY_LABEL[r.category as Category]?.ko ?? r.category} ·{" "}
                  {LINE_LABEL[r.line as ProductLine]?.ko ?? r.line} · /{r.slug}
                </p>

                {r.status !== "PUBLISHED" && r.missingForPublish.length > 0 && (
                  <p className="text-warning text-2xs mt-2 flex gap-1.5 leading-relaxed">
                    <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
                    <span>
                      공개하려면: {r.missingForPublish.map(missingLabel).join(" · ")}
                    </span>
                  </p>
                )}
              </div>

              <p className="text-secondary text-sm tabular-nums">
                {r.priceKrw != null ? `${won.format(r.priceKrw)}원` : (
                  <span className="text-muted">가격 미정</span>
                )}
              </p>

              <p className="text-muted text-2xs tabular-nums">
                <span className="sr-only">마지막 수정 </span>
                {when.format(new Date(r.updatedAt))}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="border-subtle divide-subtle divide-y border-y">
      <span className="sr-only">목록을 불러오는 중</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-6 px-3 py-5">
          <div className="bg-band aspect-[3/4] w-16 animate-pulse rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="bg-band h-3.5 w-40 animate-pulse rounded" />
            <div className="bg-band h-3 w-24 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 못 불러왔을 때. 원인마다 다음 행동이 다르다 — 로그인하러 가거나, 권한을 받거나,
 * 서버를 켜거나. "오류가 발생했습니다" 한 줄로 뭉치면 어느 쪽인지 모른다.
 */
export function ErrorNotice({ code, message }: { code: string; message: string }) {
  let next: React.ReactNode = null;
  if (code === "UNAUTHENTICATED") {
    next = (
      <Link href="/login" className="text-accent underline underline-offset-4">
        로그인하러 가기
      </Link>
    );
  } else if (code === "FORBIDDEN") {
    next = "관리자 권한이 있는 계정으로 로그인해야 합니다.";
  } else if (code === "NOT_CONNECTED") {
    next = "배포된 화면은 아직 서버와 연결되어 있지 않습니다. 로컬에서 확인해 주세요.";
  } else if (code === "NETWORK") {
    next = "서버가 켜져 있는지 확인해 주세요.";
  }

  return (
    <div role="alert" className="border-error/40 bg-velvet-tint/60 rounded-2xl border px-6 py-6">
      <p className="text-error flex gap-2 text-sm leading-relaxed">
        <Warning size={16} weight="light" aria-hidden="true" className="mt-0.5 shrink-0" />
        <span>{message}</span>
      </p>
      {next && <p className="text-secondary text-2xs mt-2 pl-6 leading-relaxed">{next}</p>}
    </div>
  );
}
