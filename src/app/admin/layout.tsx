import { AdminGate } from "@/components/admin/AdminGate";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/** 관리자 화면 공통 — 들어오는 순간 권한을 확인해 안내한다(보안은 서버가 한다 · AdminGate 참고). */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AdminGate header={<Header />} footer={<Footer />}>
      {children}
    </AdminGate>
  );
}
