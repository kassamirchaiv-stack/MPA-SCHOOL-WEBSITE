import type { Metadata } from "next";
import type { HomepageSectionKey } from "@/generated/prisma/enums";
import { getHomepageSections } from "@/server/queries/content";
import { getSiteSettings } from "@/server/queries/site";
import { parseSocialLinks } from "@/lib/social";
import { mediaUrl } from "@/lib/media";
import { publicEnv } from "@/lib/env";
import { JsonLd } from "@/components/public/json-ld";
import { LegacyHashRedirect } from "@/components/public/legacy-hash-redirect";
import {
  AboutSection,
  CtaSection,
  EventsSection,
  GallerySection,
  HeroSection,
  NewsSection,
  ProgramsSection,
  StatisticsSection,
  StudentLifeSection,
  WhyMpaSection,
  type SectionProps,
} from "@/components/public/home-sections";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const SECTIONS: Record<HomepageSectionKey, (props: SectionProps) => React.ReactNode> = {
  HERO: HeroSection,
  STATISTICS: StatisticsSection,
  ABOUT: AboutSection,
  PROGRAMS: ProgramsSection,
  WHY_MPA: WhyMpaSection,
  STUDENT_LIFE: StudentLifeSection,
  NEWS: NewsSection,
  EVENTS: EventsSection,
  GALLERY: GallerySection,
  CTA: CtaSection,
};

export default async function HomePage() {
  const [settings, sections] = await Promise.all([getSiteSettings(), getHomepageSections()]);
  if (!settings) return null;

  const socials = parseSocialLinks(settings.socialLinks).map((s) => s.url);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "School",
          name: settings.schoolName,
          alternateName: settings.shortName,
          slogan: settings.tagline ?? undefined,
          description: settings.description ?? undefined,
          url: publicEnv.siteUrl,
          logo: settings.logo ? mediaUrl(settings.logo) : undefined,
          email: settings.email ?? undefined,
          telephone: settings.phone ?? undefined,
          address: settings.address ?? undefined,
          foundingDate: settings.foundedYear ?? undefined,
          sameAs: socials.length > 0 ? socials : undefined,
        }}
      />
      <LegacyHashRedirect />
      {sections.map((section, i) => {
        const Section = SECTIONS[section.key];
        return <Section key={section.id} section={section} settings={settings} previousKey={sections[i - 1]?.key} />;
      })}
    </>
  );
}
