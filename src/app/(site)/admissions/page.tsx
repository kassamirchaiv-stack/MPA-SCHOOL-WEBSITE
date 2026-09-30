import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { getHighlights, getPage, getPublishedFaqs } from "@/server/queries/content";
import { getSiteSettings } from "@/server/queries/site";
import { pageMetadata } from "@/server/page-meta";
import { telHref } from "@/lib/utils";
import { PageHero } from "@/components/public/page-hero";
import { FaqList, StepList } from "@/components/public/blocks";
import { RichText, hasRichText } from "@/components/public/rich-text";
import { SectionHeader } from "@/components/public/section-header";

export const generateMetadata = () => pageMetadata("admissions", "/admissions", "Admissions");

export default async function AdmissionsPage() {
  const [page, steps, faqs, settings] = await Promise.all([
    getPage("admissions"),
    getHighlights("ADMISSION_STEP"),
    getPublishedFaqs(),
    getSiteSettings(),
  ]);
  const admissionFaqs = faqs.filter((f) => f.category === "Admissions");

  return (
    <>
      <PageHero
        title={page?.title ?? "Admissions"}
        eyebrow={page?.eyebrow}
        intro={page?.intro}
        image={page?.heroImage}
        breadcrumbs={[{ label: "Admissions", href: "/admissions" }]}
      />

      {steps.length > 0 && (
        <section aria-labelledby="steps" className="py-16 lg:py-24">
          <div className="container-site">
            <SectionHeader id="steps" eyebrow="How it works" title="Registration steps" />
            <StepList steps={steps} />
          </div>
        </section>
      )}

      <section className="bg-surface py-16 lg:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-[2fr_1fr]">
          <div>{page && hasRichText(page.content) && <RichText content={page.content} className="text-lg" />}</div>
          <aside aria-labelledby="registrar" className="h-fit rounded-card bg-secondary p-8 text-on-secondary">
            <h2 id="registrar" className="text-2xl">
              Contact the registrar
            </h2>
            <p className="mt-3 text-on-secondary/80">For placement, documentation and fee guidance.</p>
            <ul className="mt-6 space-y-3">
              {settings?.phone && (
                <li>
                  <a href={telHref(settings.phone)} className="inline-flex items-center gap-3 hover:text-accent">
                    <Phone aria-hidden className="size-4 text-accent" /> {settings.phone}
                  </a>
                </li>
              )}
              {settings?.email && (
                <li>
                  <a href={`mailto:${settings.email}`} className="inline-flex items-center gap-3 break-all hover:text-accent">
                    <Mail aria-hidden className="size-4 shrink-0 text-accent" /> {settings.email}
                  </a>
                </li>
              )}
            </ul>
            <Link href="/contact" className="btn btn-accent mt-8 w-full">
              Send an enquiry
            </Link>
          </aside>
        </div>
      </section>

      {admissionFaqs.length > 0 && (
        <section aria-labelledby="admission-faq" className="py-16 lg:py-24">
          <div className="container-site">
            <div className="max-w-4xl">
            <SectionHeader id="admission-faq" eyebrow="Questions" title="Admissions FAQs" />
            <FaqList faqs={admissionFaqs} />
            <Link href="/faq" className="mt-8 inline-flex items-center gap-2 font-semibold text-primary">
              All frequently asked questions <ArrowRight aria-hidden className="size-4" />
            </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
