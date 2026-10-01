"use client";

import { ArrowLeft, CheckCircle, Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { ErrorNotice } from "@/components/admin/AdminProductList";
import { ProductForm } from "@/components/admin/ProductForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  ADMIN_CONNECTED,
  AdminApiError,
  getProduct,
  missingLabel,
  publishProduct,
  unpublishProduct,
  type AdminProductEdit,
} from "@/lib/admin";

/**
 * 상품 수정 · 공개.
 *
 * ── id 를 쿼리로 받는다 ─────────────────────────────────
 * 정적 내보내기라 `/admin/products/[id]` 같은 동적 경로를 만들 수 없다
 * (빌드 때 id 목록을 알아야 한다). 그래서 `/admin/products/edit?id=…` 다.
 * 읽는 방식은 상품 목록의 `?category=` 와 같다 — useSyncExternalStore.
 *
 * ── 저장과 공개는 다른 버튼이다 ─────────────────────────
 * 공개는 **서버에 저장된 내용** 기준이다. 폼에서 고치고 저장하지 않은 채 공개를 누르면
 * 고치기 전 내용이 나간다. 그래서 공개 판 옆에 그 사실을 적어 둔다.
 *
 * ── 저장 뒤 다시 읽을 때 폼을 치우지 않는다 ─────────────
 * 공개 가능 여부는 서버가 판단하므로 저장할 때마다 다시 읽는다. 이때 로딩 화면으로
 * 바꾸면 폼이 새로 그려지면서 스크롤 위치와 입력 중이던 초점이 날아간다.
 */

type State =
  | { kind: "loading" }
  | { kind: "error"; code: string; message: string }
  | { kind: "ready"; product: AdminProductEdit };

export function AdminProductEditor() {
  /*
    undefined = 아직 모른다(정적 HTML 단계), null = 주소에 id 가 없다.
    둘을 같은 값으로 두면 멀쩡한 링크로 들어와도 하이드레이션 전까지
    "상품을 골라 주세요" 가 번쩍 보인다.
  */
  const id = useSyncExternalStore<string | null | undefined>(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("id"),
    () => undefined,
  );

  const [state, setState] = useState<State>({ kind: "loading" });

  /** 저장·공개 뒤 다시 읽기. 이벤트에서 부른다. */
  const reload = useCallback(async (productId: string) => {
    setState(await fetchState(productId));
  }, []);

  useEffect(() => {
    if (!ADMIN_CONNECTED || !id) return;
    // 결과가 온 뒤에만 상태를 바꾼다. 그 사이 화면을 떠났으면 버린다.
    let alive = true;
    fetchState(id).then((next) => alive && setState(next));
    return () => {
      alive = false;
    };
  }, [id]);

  /*
    상품을 못 그리는 상태에서도 제목(h1)은 있어야 한다. 페이지에 h1 이 없으면
    스크린리더 사용자가 "지금 어느 화면인가" 를 알 길이 없다.
  */
  if (!ADMIN_CONNECTED) {
    return (
      <Fallback>
        <ErrorNotice code="NOT_CONNECTED" message="서버가 아직 연결되지 않았습니다." />
      </Fallback>
    );
  }
  if (id === null) {
    return (
      <Fallback>
        <p className="text-secondary text-sm leading-relaxed">고칠 상품을 목록에서 골라 주세요.</p>
      </Fallback>
    );
  }
  if (id === undefined || state.kind === "loading") {
    return (
      <Fallback>
        <p aria-busy="true" className="text-muted text-sm">
          상품을 불러오는 중
        </p>
      </Fallback>
    );
  }
  if (state.kind === "error") {
    // 잘못된 id 형식(400)도 관리자에게는 "그런 상품 없음" 과 같은 뜻이다.
    const notFound = state.code === "NOT_FOUND" || state.code === "INVALID_PARAMETER";
    return (
      <Fallback>
        <ErrorNotice
          code={state.code}
          message={notFound ? "상품을 찾을 수 없습니다." : state.message}
        />
      </Fallback>
    );
  }

  const p = state.product;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <BackLink />
        <Eyebrow>ADMIN</Eyebrow>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-primary leading-display tracking-display text-3xl md:text-4xl">
            {p.name ?? "이름 없는 상품"}
          </h1>
          <StatusBadge status={p.status} />
        </div>
        <p className="text-muted text-2xs">/{p.slug}</p>
      </div>

      <PublishPanel product={p} onChanged={() => reload(p.id)} />

      <ProductForm initial={p} onSaved={() => reload(p.id)} />
    </div>
  );
}

async function fetchState(id: string): Promise<State> {
  try {
    return { kind: "ready", product: await getProduct(id) };
  } catch (e) {
    return e instanceof AdminApiError
      ? { kind: "error", code: e.code, message: e.message }
      : { kind: "error", code: "UNKNOWN", message: "상품을 불러오지 못했습니다." };
  }
}

function PublishPanel({
  product,
  onChanged,
}: {
  product: AdminProductEdit;
  onChanged: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 내리기는 한 번 더 묻는다. 손님이 보고 있던 상품이 즉시 사라진다. */
  const [confirming, setConfirming] = useState(false);

  const published = product.status === "PUBLISHED";
  const missing = product.missingForPublish;

  async function run(action: (id: string) => Promise<void>) {
    setPending(true);
    setError(null);
    try {
      await action(product.id);
      await onChanged();
      setConfirming(false);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "처리하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      aria-labelledby="publish-heading"
      className="border-subtle bg-band/60 flex flex-col gap-4 rounded-2xl border px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7"
    >
      <div className="min-w-0">
        <h2 id="publish-heading" className="text-primary text-sm font-medium">
          {published ? "손님에게 공개 중" : "아직 공개되지 않음"}
        </h2>

        {published ? (
          <p className="text-muted text-2xs mt-1.5 leading-relaxed">
            {/* 손님 화면은 정적 사이트라 서버가 다시 빌드를 요청한다(BE FrontRebuildTrigger). */}
            아래에서 저장하면 1~2분 뒤 손님 화면에 반영됩니다. 공개·비공개도 같습니다.
          </p>
        ) : missing.length > 0 ? (
          <p className="text-warning text-2xs mt-1.5 flex gap-1.5 leading-relaxed">
            <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
            <span>공개하려면 필요한 것: {missing.map(missingLabel).join(" · ")}</span>
          </p>
        ) : (
          <p className="text-secondary text-2xs mt-1.5 flex gap-1.5 leading-relaxed">
            <CheckCircle size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
            <span>공개할 준비가 됐습니다. 공개는 저장된 내용 기준입니다 — 고친 게 있으면 먼저 저장하세요.</span>
          </p>
        )}

        {error && (
          <p role="alert" className="text-error text-2xs mt-2 leading-relaxed">
            {error}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {published ? (
          confirming ? (
            /*
              "취소" 가 먼저다 — 방금 누른 "비공개로 내리기" 와 같은 자리에 온다.
              확인 버튼이 그 자리에 뜨면 더블클릭 한 번에 확인까지 눌려서 묻는 의미가 없다.
            */
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirming(false)}
                className="border-interactive text-secondary hover:border-accent ease-fluid inline-flex min-h-11 items-center rounded-full border px-5 text-sm transition-colors duration-300"
              >
                취소
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(unpublishProduct)}
                className="border-error text-error hover:bg-velvet-tint ease-fluid inline-flex min-h-11 items-center rounded-full border px-5 text-sm transition-colors duration-300 disabled:opacity-60"
              >
                {pending ? "내리는 중" : "네, 내립니다"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="border-interactive text-secondary hover:border-accent hover:text-primary ease-fluid inline-flex min-h-11 items-center rounded-full border px-5 text-sm transition-colors duration-300"
            >
              비공개로 내리기
            </button>
          )
        ) : (
          <button
            type="button"
            // 모자란 게 있으면 누를 수 없게 둔다. 서버도 막지만(409), 눌러 보고 거절당할 이유가 없다.
            disabled={pending || missing.length > 0}
            onClick={() => run(publishProduct)}
            className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-11 items-center rounded-full px-6 text-sm transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "공개하는 중" : "공개하기"}
          </button>
        )}
      </div>
    </section>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/products"
      className="text-secondary hover:text-accent ease-fluid text-2xs inline-flex min-h-11 w-fit items-center gap-1.5 transition-colors duration-300"
    >
      <ArrowLeft size={14} weight="light" aria-hidden="true" />
      상품 목록
    </Link>
  );
}

function Fallback({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <BackLink />
        <Eyebrow>ADMIN</Eyebrow>
      </div>
      <h1 className="font-display text-primary leading-display tracking-display text-3xl md:text-4xl">
        상품 수정
      </h1>
      {children}
    </div>
  );
}
