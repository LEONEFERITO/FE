import type { Metadata } from "next";

import { NoticeView } from "@/components/content/NoticeView";
import { ShopPage } from "@/components/shop/ShopPage";

/** 공지 하나. `?id=` — 정적 내보내기라 동적 경로 대신 쿼리다. */

export const metadata: Metadata = {
  title: "공지사항",
};

export default function NoticeViewPage() {
  return (
    <ShopPage eyebrow="NOTICE" title="공지사항" narrow>
      <NoticeView />
    </ShopPage>
  );
}
