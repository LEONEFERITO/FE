import type { Metadata } from "next";

import { NoticeList } from "@/components/content/NoticeList";
import { ShopPage } from "@/components/shop/ShopPage";
import { shareMetadata } from "@/lib/metadata";

/** 공지사항 — 배송 일정 · 휴무 · 정책 변경. 관리자가 올린 것을 브라우저에서 바로 읽는다. */

export const metadata: Metadata = shareMetadata({
  title: "공지사항",
  description: "레오네페리토 공지사항 — 배송 일정, 매장 휴무, 교환·반품 정책 등 새 소식.",
  path: "/notice/",
});

export default function NoticePage() {
  return (
    <ShopPage eyebrow="NOTICE" title="공지사항" narrow>
      <NoticeList />
    </ShopPage>
  );
}
