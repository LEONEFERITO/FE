import { AdminFrame } from "@/components/admin/AdminFrame";
import { AdminGate } from "@/components/admin/AdminGate";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/**
 * 관리자 화면 공통 — 들어오는 순간 권한을 확인해 안내한다(보안은 서버가 한다 · AdminGate 참고).
 *
 * 2026-10-06 고객 요청으로 틀을 바꿨다: 손님 사이트의 헤더 · 푸터 대신 **위 띠 + 왼쪽 세로 메뉴 + 본문**(AdminFrame).
 * 권한이 없을 때의 안내 화면만 손님 사이트의 헤더 · 푸터로 감싼다 — 손님에게 관리자 틀을 보일 이유가 없다.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AdminGate header={<Header />} footer={<Footer />}>
      <AdminFrame>{children}</AdminFrame>
    </AdminGate>
  );
}
