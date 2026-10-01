import type { Metadata } from "next";

import { NoticeList } from "@/components/content/NoticeList";
import { ShopPage } from "@/components/shop/ShopPage";

/** 공지사항 — 배송 일정 · 휴무 · 정책 변경. 관리자가 올린 것을 브라우저에서 바로 읽는다. */

export const metadata: Metadata = {
  title: "공지사항",
  description: "LEONE FERITO 공지사항 — 배송 일정, 휴무, 정책 안내.",
};

export default function NoticePage() {
  return (
    <ShopPage eyebrow="NOTICE" title="공지사항" narrow>
      <NoticeList />
    </ShopPage>
  );
}
