import type { Metadata } from "next";

import { BannerPreviewCanvas } from "@/components/admin/BannerPreviewCanvas";

/** 관리자 "메인 배너" 의 PC · 모바일 미리보기 창 안쪽. 혼자 열면 빈 화면이다. */
export const metadata: Metadata = {
  title: "배너 미리보기",
  robots: { index: false, follow: false },
};

export default function BannerPreviewPage() {
  return <BannerPreviewCanvas />;
}
