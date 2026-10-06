import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminSiteImagesEditor } from "@/components/admin/AdminSiteImagesEditor";
import { siteImageGroup } from "@/data/siteImageGroups";

const group = siteImageGroup("line")!;

export const metadata: Metadata = {
  title: "라인 페이지 사진",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AdminPage title={group.title} description={group.description}>
      <AdminSiteImagesEditor group={group} />
    </AdminPage>
  );
}
