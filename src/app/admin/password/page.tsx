import type { Metadata } from "next";

import { AdminAuthFrame } from "@/components/admin/AdminAuthFrame";
import { AdminPasswordForm } from "@/components/admin/AdminPasswordForm";

/** 관리자 비밀번호 바꾸기 — 임시 비밀번호 계정은 여기를 거쳐야 관리자 화면이 열린다. */

export const metadata: Metadata = {
  title: "관리자 비밀번호 변경",
  robots: { index: false, follow: false },
};

export default function AdminPasswordPage() {
  return (
    <AdminAuthFrame
      title="비밀번호 바꾸기"
      description="다른 사람이 짐작할 수 없는 비밀번호로 바꿔 주세요. 다른 기기의 로그인은 끊깁니다."
    >
      <AdminPasswordForm />
    </AdminAuthFrame>
  );
}
