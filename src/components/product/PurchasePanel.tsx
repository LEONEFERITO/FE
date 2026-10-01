"use client";

import { ArrowDown, ArrowUpRight, InstagramLogo } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginUrl } from "@/lib/auth";
import { SHOP_CONNECTED, ShopError, addToCart } from "@/lib/shop";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { pendingLabel } from "@/lib/pending";

import { LineSummary } from "@/components/product/LineBadge";
import { SizeSelector } from "@/components/product/SizeSelector";
import { CATEGORY_LABEL } from "@/types/product";
import type { Product } from "@/types/product";

/**
 * 구매 패널.
 *
 * 순서 (고객 요청, 2026-09-30):
 *   상품명 → 가격 → 핏 → [색상] → 사이즈 → 인스타그램 → 구매 버튼
 *
 * 색상은 자리만 정해졌다 — 색상별 사진·가격·사이즈 구조를 고객에게 확인 중이다.
 * TODO(고객확인) 색상 옵션 구조가 정해지면 사이즈 위에 넣는다.
 *
 * 상세 사이즈 차트와 모델 정보는 아래 "상세 사이즈" 구간으로 내려갔다(같은 요청).
 * 그래서 사이즈를 고르는 자리에 **거기로 내려가는 링크**를 둔다 — 차트를 안 보고
 * 고르게 되면 그 실패가 사이즈 교환 CS 로 돌아온다.
 */

function formatKrw(value: number | null): string | null {
  if (value === null) return null;
  return new Intl.NumberFormat("ko-KR").format(value) + "원";
}

export function PurchasePanel({ product }: { product: Product }) {
  // 기본 선택은 주문 가능한 첫 사이즈. 주문 가능한 사이즈가 없으면 선택하지 않는다.
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.skus.find((s) => s.orderable)?.size ?? null,
  );
  const router = useRouter();
  const [pending, setPending] = useState<"cart" | "buy" | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  /*
    담기 · 바로 구매. 회원만 주문한다(D1) — 로그인이 필요하면 로그인 화면으로 보냈다가
    이 상품으로 다시 돌아오게 한다. 바로 구매는 담은 그 한 줄만 주문서로 가져간다.
  */
  async function put(mode: "cart" | "buy") {
    if (!selectedSize) return;
    if (!SHOP_CONNECTED) {
      setNotice({ tone: "error", text: "화면 확인 단계입니다. 주문 서버가 아직 연결되지 않았습니다." });
      return;
    }
    setPending(mode);
    setNotice(null);
    try {
      const cart = await addToCart(product.slug, selectedSize, 1);
      if (mode === "buy") {
        const line = cart.items.find((l) => l.slug === product.slug && l.size === selectedSize);
        router.push(line ? `/checkout/?items=${encodeURIComponent(line.id)}` : "/cart/");
        return;
      }
      setNotice({ tone: "ok", text: `${selectedSize} 사이즈를 장바구니에 담았습니다.` });
    } catch (e) {
      if (e instanceof ShopError && e.needsLogin) {
        window.location.href = loginUrl();
        return;
      }
      setNotice({ tone: "error", text: e instanceof ShopError ? e.message : "담지 못했습니다." });
    } finally {
      setPending(null);
    }
  }

  const price = formatKrw(product.priceKrw);
  const listPrice = formatKrw(product.listPriceKrw);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Eyebrow>{CATEGORY_LABEL[product.category].en}</Eyebrow>

      <h1 className="font-display text-primary text-3xl leading-display tracking-display md:text-4xl">
        {product.name ?? pendingLabel("제품명")}
      </h1>

      {product.summary && (
        <p className="text-secondary text-sm leading-relaxed">{product.summary}</p>
      )}

      <div className="flex items-baseline gap-3">
        <p
          className={`font-display text-2xl tabular-nums ${price ? "text-primary" : "text-muted"}`}
        >
          {price ?? pendingLabel("판매가")}
        </p>
        {listPrice && (
          /* 정가 취소선은 버건디로. 서브 컬러가 실제로 일하는 몇 안 되는 자리다 —
             세일이라는 사실이 한눈에 읽혀야 하고, 면적은 아주 좁다. */
          <p className="text-accent text-(length:--fs-base) tabular-nums line-through">
            {listPrice}
          </p>
        )}
      </div>

      {/*
        제작 기간 — 주문 후 만드는 옷이라 결제 전에 반드시 보여야 한다(전자상거래법, 약관 제14조).
        가격 바로 아래에 둔다. 사이즈를 다 고른 뒤에야 "3주 걸립니다" 를 보면 배신감이 든다.
      */}
      <p className="text-secondary text-xs">
        {product.leadTimeDays != null ? (
          <>
            주문 후 제작 · <b className="text-primary font-medium">약 {product.leadTimeDays}일</b> 뒤 출고
          </>
        ) : (
          <span className="text-muted">{pendingLabel("제작 기간")}</span>
        )}
      </p>

      <LineSummary line={product.line} />

      <hr className="border-subtle my-2" />

      <div className="flex items-baseline justify-between">
        <h2 className="text-primary text-sm font-medium">사이즈</h2>
        {/* 같은 페이지 안의 이동이라 <a> 로 둔다. 화살표도 아래를 가리킨다. */}
        <a
          href="#size-detail"
          className="text-accent hover:text-accent ease-fluid group inline-flex min-h-11 items-center gap-1.5 text-xs transition-colors duration-500"
        >
          상세 사이즈 보기
          <span className="ease-fluid transition-transform duration-500 group-hover:translate-y-0.5">
            <ArrowDown size={11} weight="light" aria-hidden="true" />
          </span>
        </a>
      </div>

      <SizeSelector
        skus={product.skus}
        value={selectedSize}
        onChange={setSelectedSize}
      />

      {product.instagramUrl && (
        /*
          바깥 사이트로 나가므로 새 창이다. 그 사실을 글로도 알린다 —
          화면을 못 보는 사람에게는 창이 바뀐 걸 알 방법이 없다.
          noopener: 열린 창이 이 페이지를 조작하지 못하게.
        */
        <a
          href={product.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border-interactive text-secondary hover:border-accent hover:text-primary ease-fluid group mt-1 inline-flex min-h-11 w-fit items-center gap-2 rounded-full border px-5 text-xs transition-colors duration-300"
        >
          <InstagramLogo size={15} weight="light" aria-hidden="true" />
          인스타그램에서 보기
          <ArrowUpRight size={11} weight="light" aria-hidden="true" />
          <span className="sr-only">(새 창)</span>
        </a>
      )}

      <hr className="border-subtle my-2" />

      {/*
        주 버튼 — 포인트 컬러(고동색) 채움. 베이지 배경 대비 9.64:1 이라
        면만으로도 버튼이 확실히 보인다. (다크 테마에서는 벨벳이 1.89:1 이라
        골드 헤어라인으로 경계를 만들어야 했다 — 배경이 바뀌면 필요한 처치도 바뀐다)

        화살표는 텍스트 옆에 맨몸으로 두지 않고 자체 원형 안에 넣는다.
        hover 시 원이 대각선으로 밀려나며 버튼 내부에 운동감이 생긴다.

        D1(판매 범위) 미확정 — 커머스 기준이다. 카탈로그로 확정되면 라벨만 바뀐다.
      */}
      <div className="mt-3 flex flex-col gap-2.5">
        <button
          type="button"
          disabled={!selectedSize || pending !== null}
          onClick={() => put("cart")}
          className="group bg-accent hover:bg-accent-hover text-on-accent shadow-button hover:shadow-button-hover tracking-button ease-fluid flex items-center justify-between gap-4 rounded-full py-4 pl-7 pr-2 text-[15px] transition-all duration-500 hover:-translate-y-px active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-y-0"
        >
          <span className="flex-1 text-center">{pending === "cart" ? "담는 중" : "장바구니 담기"}</span>
          <span className="bg-on-accent/12 ease-fluid flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-500 group-hover:-translate-y-px group-hover:translate-x-1 group-hover:scale-105">
            <ArrowUpRight size={11} weight="light" aria-hidden="true" />
          </span>
        </button>

        <button
          type="button"
          disabled={!selectedSize || pending !== null}
          onClick={() => put("buy")}
          className="border-strong hover:border-accent hover:text-accent hover:shadow-soft text-primary tracking-button ease-fluid rounded-full border py-4 text-[15px] transition-all duration-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {pending === "buy" ? "주문서로 가는 중" : "바로 구매"}
        </button>

        {notice && (
          <p
            role={notice.tone === "error" ? "alert" : "status"}
            className={`text-2xs flex flex-wrap items-center gap-x-3 gap-y-1 leading-relaxed ${
              notice.tone === "ok" ? "text-success" : "text-error"
            }`}
          >
            <span>{notice.text}</span>
            {notice.tone === "ok" && (
              <Link href="/cart/" className="text-accent inline-flex min-h-11 items-center underline underline-offset-4">
                장바구니 보기
              </Link>
            )}
          </p>
        )}
      </div>

      {/*
        의류는 사이즈 교환이 CS 의 대부분이다. 구매 직전에 교환 조건이 보여야
        "일단 사보고 안 맞으면 바꾸지" 라는 결심이 선다.
      */}
      <ul className="mt-2 flex flex-col gap-2">
        {[
          // TODO(고객확인) D-1 · A-3: 값이 오면 이 배열을 실제 정책 문장으로 바꾼다
          pendingLabel("배송비 정책"),
          pendingLabel("교환·반품 기간과 배송비 부담"),
          pendingLabel("사이즈 교환 조건"),
        ].map((line) => (
          <li key={line} className="text-muted flex gap-2 text-xs">
            <span
              aria-hidden="true"
              className="bg-strong mt-2 h-px w-2.5 shrink-0"
            />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
