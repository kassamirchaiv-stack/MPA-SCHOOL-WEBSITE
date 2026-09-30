import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { getPage, getPublishedFaqs, type FaqData } from "@/server/queries/content";
import { pageMetadata } from "@/server/page-meta";
import { PageHero } from "@/components/public/page-hero";
import { FaqList } from "@/components/public/blocks";
import { EmptyState } from "@/components/public/empty-state";
import { JsonLd } from "@/components/public/json-ld";

export const generateMetadata = () => pageMetadata("faq", "/faq", "Frequently Asked Questions");

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default async function FaqPage() {
  const [page, faqs] = await Promise.all([getPage("faq"), getPublishedFaqs()]);
  const groups = new Map<string, FaqData[]>();
  for (const faq of faqs) {
    const key = faq.category || "General";
    groups.set(key, [...(groups.get(key) ?? []), faq]);
  }

  return (
    <>
      {faqs.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          }}
        />
      )}
      <PageHero
        title={page?.title ?? "Frequently Asked Questions"}
        eyebrow={page?.eyebrow}
        intro={page?.intro}
        breadcrumbs={[{ label: "FAQ", href: "/faq" }]}
      />
      <div className="container-site py-16 lg:py-24">
        {faqs.length === 0 ? (
          <EmptyState icon={HelpCircle} title="No questions have been published yet" />
        ) : (
          <div className="grid gap-12 lg:grid-cols-[14rem_1fr]">
            {groups.size > 1 && (
              <nav aria-label="FAQ categories" className="lg:sticky lg:top-28 lg:h-fit">
                <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
                  {[...groups.keys()].map((category) => (
                    <li key={category}>
                      <a
                        href={`#${slugify(category)}`}
                        className="block rounded-btn border border-border px-3 py-2 text-sm font-semibold hover:border-primary hover:text-primary lg:border-0 lg:px-0"
                      >
                        {category}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            <div className="max-w-3xl space-y-14">
              {[...groups.entries()].map(([category, items]) => (
                <section key={category} id={slugify(category)} aria-labelledby={`${slugify(category)}-title`} className="scroll-mt-28">
                  <h2 id={`${slugify(category)}-title`} className="mb-4 text-2xl text-primary">
                    {category}
                  </h2>
                  <FaqList faqs={items} />
                </section>
              ))}
              <p className="text-muted">
                Can’t find your answer?{" "}
                <Link href="/contact" className="font-semibold text-primary underline underline-offset-4">
                  Contact the school office
                </Link>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
