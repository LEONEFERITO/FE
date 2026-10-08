"use client";

import { FunnelSimple, X } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";

/**
 * 모바일 필터 — 아래에서 올라오는 시트.
 *
 * ── 왜 바꿨나 ───────────────────────────────────────────
 * 라인 · 카테고리 · 사이즈 · 재고를 세로로 쌓으니 모바일에서 **첫 상품이 보이기 전에
 * 400px 넘게** 필터가 차지했다. 목록을 보러 온 사람이 필터부터 스크롤해야 한다.
 * 데스크톱은 폭이 남아 그대로 펼쳐 두는 게 낫다 — 그래서 시트는 모바일에만 쓴다.
 *
 * ── 왜 초안(draft)을 따로 두는가 ────────────────────────
 * 시트가 목록을 덮고 있어서, 고르는 즉시 적용해 봐야 **결과가 안 보인다.**
 * 그래서 시트 안에서는 초안만 바꾸고 "보기" 를 눌러야 실제로 적용한다.
 * 대신 버튼에 결과 개수를 실시간으로 띄워, 닫기 전에 몇 개가 남는지 알 수 있게 한다.
 * 닫기는 초안을 버린다 — 시트를 연 것만으로 목록이 바뀌면 안 된다.
 *
 * ── <dialog> 를 쓰는 이유 ───────────────────────────────
 * 초점 가두기 · Esc 닫기 · 바깥 비활성화 · 본문 스크롤 잠금을 브라우저가 해 준다.
 * 손으로 만들면 그 넷 중 하나는 반드시 빠지고, 빠진 게 초점 가두기면
 * 키보드 사용자는 시트 뒤의 목록을 더듬게 된다.
 */

interface Props {
  /** 지금 걸린 필터 개수. 0 이면 배지를 숨긴다. */
  activeCount: number;
  /** 초안 상태에서의 결과 개수. 버튼에 실시간으로 띄운다. */
  draftResultCount: number;
  /** 시트가 열릴 때 호출 — 현재 적용값을 초안으로 복사한다. */
  onOpen: () => void;
  /** 초안을 실제 필터로 적용한다. */
  onApply: () => void;
  /** 초안을 버린다. */
  onCancel: () => void;
  onReset: () => void;
  children: React.ReactNode;
  /** 여는 버튼 글자 (기본 "거르기"). 도구 줄에서는 "FILTER" */
  label?: string;
  /** 여는 버튼 모양 — 도구 줄의 한 칸을 채울 때 넘긴다 */
  triggerClassName?: string;
}

export function FilterSheet({
  activeCount,
  draftResultCount,
  onOpen,
  onApply,
  onCancel,
  onReset,
  children,
  label = "거르기",
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  function openSheet() {
    onOpen();
    setOpen(true);
  }

  function close(apply: boolean) {
    if (apply) onApply();
    else onCancel();
    setOpen(false);
  }

  return (
    <>
      {/* 여는 버튼. 데스크톱에는 없다 — 거기선 필터가 펼쳐져 있다. */}
      <button
        type="button"
        onClick={openSheet}
        className={
          triggerClassName ??
          "border-interactive text-primary hover:border-accent hover:text-accent ease-fluid text-2xs inline-flex min-h-11 items-center gap-2 rounded-full border px-5 transition-all duration-300 md:hidden"
        }
      >
        {!triggerClassName && <FunnelSimple size={14} weight="light" aria-hidden="true" />}
        {label}
        {activeCount > 0 && (
          /*
            숫자만으로 알리지 않는다. 색이 안 보이는 사람에게도 "2개 적용됨" 이 전달되게
            숨은 글자를 함께 둔다 (WCAG 1.4.1).
          */
          <span className="bg-accent text-on-accent ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 tabular-nums">
            {activeCount}
            <span className="sr-only">개 적용됨</span>
          </span>
        )}
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => {
          // Esc 로 닫힌 경우도 여기로 온다. 초안은 버린다.
          onCancel();
          setOpen(false);
        }}
        onClick={(e) => {
          // 배경을 눌러도 닫힌다. 빠져나갈 길이 많을수록 좋다.
          if (e.target === dialogRef.current) close(false);
        }}
        aria-label="필터"
        /*
          시트를 화면 아래에 붙인다. dialog 는 기본이 가운데라 margin 으로 내린다.
          max-h 를 두어 필터가 길어져도 화면을 넘지 않게 하고, 안쪽이 스크롤한다.
        */
        /*
          sheet 클래스가 올라오고 내려가는 연출을 맡는다 (globals.css).
          backdrop 색도 거기서 함께 전환하므로 여기서 backdrop: 유틸을 주지 않는다 —
          두 곳에서 같은 속성을 건드리면 한쪽이 전환을 끊어먹는다.
        */
        className="sheet bg-surface text-primary border-subtle m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-3xl border-t p-0 md:hidden"
      >
        <div className="flex max-h-[85dvh] flex-col">
          {/* 손잡이. 아래에서 올라온 시트라는 걸 형태로 알린다 */}
          <div className="flex justify-center pt-3" aria-hidden="true">
            <span className="bg-border-strong h-1 w-10 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-5 pb-1 pt-3">
            <h2 className="text-primary text-(length:--fs-base) font-medium">거르기</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onReset}
                className="text-muted hover:text-accent ease-fluid text-2xs inline-flex min-h-11 items-center px-2 transition-colors duration-300"
              >
                초기화
              </button>
              <button
                type="button"
                onClick={() => close(false)}
                aria-label="닫기"
                className="text-muted hover:text-accent ease-fluid flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300"
              >
                <X size={18} weight="light" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* 필터 본문. 길어지면 여기만 스크롤한다 */}
          <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>

          {/*
            바닥 버튼은 스크롤과 무관하게 항상 보인다.
            시트 안에서 한참 내려간 사람이 적용하려고 다시 올라오게 하면 안 된다.
          */}
          <div className="border-subtle bg-surface flex gap-3 border-t px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => close(false)}
              className="border-interactive text-secondary hover:border-accent hover:text-accent ease-fluid flex min-h-12 flex-1 items-center justify-center rounded-full border text-sm transition-all duration-300"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={() => close(true)}
              className="bg-accent text-on-accent hover:bg-accent-hover shadow-button ease-fluid flex min-h-12 flex-[2] items-center justify-center rounded-full text-sm transition-all duration-300"
            >
              {/* 닫기 전에 몇 개가 남는지 알려준다. 시트가 목록을 덮고 있기 때문이다. */}
              {draftResultCount}개 보기
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
