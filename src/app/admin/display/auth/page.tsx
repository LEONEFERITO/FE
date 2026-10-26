import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminSiteImagesEditor } from "@/components/admin/AdminSiteImagesEditor";
import { siteImageGroup } from "@/data/siteImageGroups";

const group = siteImageGroup("auth")!;

export const metadata: Metadata = {
  title: "로그인 화면 사진",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AdminPage title={group.title} description={group.description}>
      <AdminSiteImagesEditor group={group} />
    </AdminPage>
  );
}
