import type { Metadata } from "next";

import { AdminAuthFrame } from "@/components/admin/AdminAuthFrame";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

/**
 * 관리자 로그인. 손님 로그인(/login)과 세션은 같고 입구만 다르다 — 아이디로도 들어오고,
 * 관리자가 아닌 계정은 받지 않는다(서버 /api/auth/admin-login).
 */

export const metadata: Metadata = {
  title: "관리자 로그인",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <AdminAuthFrame title="관리자 로그인" description="운영자 전용입니다. 아이디 또는 이메일로 로그인합니다.">
      <AdminLoginForm />
    </AdminAuthFrame>
  );
}
