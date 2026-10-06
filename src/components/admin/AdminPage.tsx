import Link from "next/link";

import type { AdminSection } from "@/components/admin/AdminNav";

/**
 * 관리자 화면 한 장의 틀 — 제목 · 한 줄 설명 · (오른쪽 위 동작) · 본문.
 *
 * 메뉴 · 위 띠는 app/admin/layout.tsx 가 두르고(왼쪽 세로 메뉴), 여기는 본문 머리만 그린다.
 * 제목이 없는 화면(상세 · 편집처럼 본문 컴포넌트가 스스로 제목을 그리는 곳)은 `title` 을 비운다.
 * `section` 은 예전 호환용이다 — 지금 메뉴는 주소로 현재 위치를 안다.
 */
export function AdminPage({
  title,
  description,
  back,
  actions,
  children,
}: {
  /** 예전 호환 — 지금은 쓰지 않는다 */
  section?: AdminSection;
  title?: string;
  description?: string;
  /** 목록으로 돌아가는 길 (등록 · 수정 화면) */
  back?: { href: string; label: string };
  /** 오른쪽 위 — "저장하기" 같은 화면 단위 동작 */
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1180px]">
      {back && (
        <Link
          href={back.href}
          className="text-secondary hover:text-accent ease-fluid text-2xs mb-2 inline-flex min-h-11 items-center transition-colors duration-300"
        >
          ← {back.label}
        </Link>
      )}
      {title && (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-primary leading-display tracking-display text-2xl md:text-3xl">{title}</h1>
            {description && <p className="text-secondary mt-2 max-w-[64ch] text-sm leading-relaxed">{description}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className={title ? "mt-8" : ""}>{children}</div>
    </div>
  );
}
