"use client";

import { CheckCircle, Warning } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

import { ErrorNotice } from "@/components/admin/AdminProductList";
import { ImageField, type ImageFieldValue } from "@/components/admin/ImageField";
import { OFFLINE_SHOP } from "@/data/business";
import { SITE_IMAGE_LIMITS, adminSiteImages, saveSiteImage, type SiteImageAdminView } from "@/lib/console";
import { SHOP_CONNECTED, ShopError } from "@/lib/shop";

/**
 * 매장 사진 — 메인 OFFLINE SHOP 구간의 왼쪽 사진을 바꾼다 (서버의 사이트 사진 칸 OFFLINE_SHOP, V20).
 *
 * 사진을 올리고 저장하면 손님 화면을 다시 만든다(1~2분). 사진을 지우고 저장하면 기본 사진으로 돌아간다 —
 * 빈 칸으로 나가지 않는다. 주소 · 운영시간 문구는 여기서 고치지 않는다(코드의 data/business.ts).
 *
 * 오른쪽 미리보기는 손님 화면과 같은 모양(각진 직사각형 · 왼쪽 사진 · 오른쪽 글자)이다. 제목 "OFFLINE SHOP" 이
 * 사진 왼쪽 아래에 얹히므로, 그 자리가 어두운 사진이 읽기 좋다 — 저장 전에 여기서 본다.
 */

const SLOT = "OFFLINE_SHOP" as const;

type State = { kind: "loading" } | { kind: "error"; code: string; message: string } | { kind: "ready" };

export function AdminSiteImageEditor() {
  const [state, setState] = useState<State>(
    SHOP_CONNECTED ? { kind: "loading" } : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );
  const [image, setImage] = useState<ImageFieldValue | null>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  function apply(v: SiteImageAdminView | undefined) {
    setImage(v?.mediaId && v.imageUrl ? { mediaId: v.mediaId, url: v.imageUrl, filename: "등록된 사진" } : null);
    setAlt(v?.alt ?? "");
  }

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    adminSiteImages()
      .then((list) => {
        if (!alive) return;
        apply(list.find((i) => i.slot === SLOT));
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setBusy(true);
    try {
      apply(await saveSiteImage(SLOT, { mediaId: image?.mediaId ?? null, alt: alt.trim() }));
      setResult({
        tone: "ok",
        text: image ? "저장했습니다. 손님 화면은 1~2분 뒤에 바뀝니다." : "사진을 비웠습니다. 1~2분 뒤 기본 사진으로 돌아갑니다.",
      });
    } catch (err) {
      setResult({ tone: "error", text: err instanceof ShopError ? err.message : "저장하지 못했습니다." });
    } finally {
      setBusy(false);
    }
  }

  const field = "border-interactive focus-visible:border-accent text-primary rounded-xl border bg-transparent px-4 text-sm";

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
      <div className="flex min-w-0 flex-col gap-8">
        <ImageField
          label="매장 사진"
          hint="메인 OFFLINE SHOP 구간의 왼쪽에 들어갑니다. 가로 · 세로 어느 쪽이든 칸에 맞게 잘립니다(가운데 기준). 지우고 저장하면 기본 사진으로 돌아갑니다."
          aspect="square"
          value={image}
          onChange={setImage}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="site-image-alt" className="text-secondary text-2xs">
            사진 설명 (선택 — 화면을 읽어 주는 기기가 읽습니다)
          </label>
          <input
            id="site-image-alt"
            value={alt}
            maxLength={SITE_IMAGE_LIMITS.alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="예) 더맨리 매장 전경"
            className={`${field} placeholder:text-muted/70 min-h-12`}
          />
          <p className="text-muted text-2xs">
            {alt.length} / {SITE_IMAGE_LIMITS.alt} · 비워 두면 장식 사진으로 처리합니다 — 주소와 운영시간은 옆의 글자가 전합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={busy}
            className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 items-center rounded-full px-8 text-sm transition-colors duration-300 disabled:opacity-60"
          >
            {busy ? "저장하는 중" : "저장"}
          </button>
          {result && (
            <p
              role={result.tone === "error" ? "alert" : "status"}
              className={`text-2xs flex gap-1.5 leading-relaxed ${result.tone === "ok" ? "text-success" : "text-error"}`}
            >
              {result.tone === "ok" ? (
                <CheckCircle size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />
              ) : (
                <Warning size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />
              )}
              <span>{result.text}</span>
            </p>
          )}
        </div>
      </div>

      {/* 미리보기 — 손님 화면과 같은 모양. 모서리를 굴리지 않는다(구간 자체가 각진 직사각형이다). */}
      <aside className="h-fit lg:sticky lg:top-24">
        <p className="text-muted text-2xs">미리보기 · {image ? "올린 사진" : "사진 없음 — 손님 화면에는 기본 사진이 나갑니다"}</p>
        <div className="bg-surface border-subtle mt-2 grid grid-cols-[11fr_14fr] border">
          <div className="bg-velvet relative aspect-[4/5]">
            {image && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={image.url} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <span
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(40,6,12,0.86) 0%, rgba(40,6,12,0.18) 52%, rgba(40,6,12,0) 100%)" }}
            />
            <p className="font-display absolute bottom-3 left-3 text-sm text-[#F7F1EA]">OFFLINE SHOP</p>
          </div>
          <div className="flex flex-col justify-center gap-3 p-4">
            <div>
              <p className="text-primary text-[10px] font-semibold">주소</p>
              <p className="text-secondary mt-0.5 text-[10px] leading-relaxed">{OFFLINE_SHOP.address}</p>
            </div>
            <div>
              <p className="text-primary text-[10px] font-semibold">운영시간</p>
              <p className="text-secondary mt-0.5 text-[10px] leading-relaxed">
                운영일 : {OFFLINE_SHOP.openDays}
                <br />
                휴무일 : {OFFLINE_SHOP.closedDays}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </form>
  );
}
