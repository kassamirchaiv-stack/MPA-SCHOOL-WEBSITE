import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/page-header";
import { AlbumForm } from "../album-form";

export const metadata: Metadata = { title: "New album" };

export default async function NewAlbumPage() {
  await requireAdminPage("gallery.manage");
  return (
    <>
      <PageHeader title="New album" breadcrumbs={[{ label: "Gallery", href: "/admin/gallery" }, { label: "New album" }]} />
      <AlbumForm defaults={{ title: "", slug: "", description: "", category: "", date: "", coverImageId: "", featured: false, status: "DRAFT" }} />
    </>
  );
}
