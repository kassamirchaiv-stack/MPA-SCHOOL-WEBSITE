import { Users } from "lucide-react";
import { getPage, getPublishedStaff } from "@/server/queries/content";
import { pageMetadata } from "@/server/page-meta";
import { PageHero } from "@/components/public/page-hero";
import { StaffCard } from "@/components/public/cards";
import { EmptyState } from "@/components/public/empty-state";
import { SectionHeader } from "@/components/public/section-header";

export const generateMetadata = () => pageMetadata("leadership", "/about/leadership", "Leadership & Staff");

export default async function LeadershipPage() {
  const [page, staff] = await Promise.all([getPage("leadership"), getPublishedStaff()]);
  const leaders = staff.filter((m) => m.featured);
  const others = staff.filter((m) => !m.featured);

  return (
    <>
      <PageHero
        title={page?.title ?? "Leadership & Staff"}
        eyebrow={page?.eyebrow}
        intro={page?.intro}
        image={page?.heroImage}
        breadcrumbs={[
          { label: "About", href: "/about" },
          { label: page?.title ?? "Leadership & Staff", href: "/about/leadership" },
        ]}
      />
      <div className="container-site space-y-20 py-16 lg:py-24">
        {staff.length === 0 && <EmptyState icon={Users} title="Staff profiles are coming soon" />}
        {leaders.length > 0 && (
          <section aria-labelledby="leadership">
            <SectionHeader id="leadership" eyebrow="Leadership" title="School leadership" />
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {leaders.map((member) => (
                <li key={member.id}>
                  <StaffCard member={member} />
                </li>
              ))}
            </ul>
          </section>
        )}
        {others.length > 0 && (
          <section aria-labelledby="staff">
            <SectionHeader id="staff" eyebrow="Our team" title={leaders.length > 0 ? "Staff" : "Our staff"} />
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((member) => (
                <li key={member.id}>
                  <StaffCard member={member} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
