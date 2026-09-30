import { getPage } from "@/server/queries/content";
import { pageMetadata } from "@/server/page-meta";
import { PageHero } from "@/components/public/page-hero";
import { RichText } from "@/components/public/rich-text";
import { formatDate } from "@/lib/format";

export const generateMetadata = () => pageMetadata("privacy", "/privacy", "Privacy Policy");

export default async function PrivacyPage() {
  const page = await getPage("privacy");
  return (
    <>
      <PageHero title={page?.title ?? "Privacy Policy"} intro={page?.intro} breadcrumbs={[{ label: "Privacy", href: "/privacy" }]} />
      <div className="container-site py-16 lg:py-20">
        <RichText content={page?.content} />
        {page && <p className="mt-12 text-sm text-muted">Last updated {formatDate(page.updatedAt)}</p>}
      </div>
    </>
  );
}
