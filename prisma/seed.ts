/**
 * Seeds the CMS with the real content of the previous mpa.edu.et website
 * (data/site-content.json and data/school-kb.json, retrieved 2026-09-30).
 *
 *   npm run db:seed
 *
 * Idempotent: singletons are upserted; collections are only filled when empty, so
 * re-running never overwrites edits made in the admin.
 *
 * Deliberately NOT seeded: the five stock photos from the old site (they are not
 * MPA photos), the chatbot (replaced by FAQs), the parent/student app link (no URL).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { DEFAULT_THEME } from "../src/lib/theme";
import { ensureBuckets } from "../scripts/setup-storage";

config({ path: [".env.local", ".env"], quiet: true });

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } }) : null;

// ─── Tiptap JSON helpers ──────────────────────────────────────────────────────

type Node = Prisma.InputJsonObject;
const text = (value: string): Node => ({ type: "text", text: value });
const p = (value: string): Node => ({ type: "paragraph", content: [text(value)] });
const h2 = (value: string): Node => ({ type: "heading", attrs: { level: 2 }, content: [text(value)] });
const ul = (items: string[]): Node => ({
  type: "bulletList",
  content: items.map((item) => ({ type: "listItem", content: [p(item)] })),
});
const doc = (...content: Node[]): Prisma.InputJsonObject => ({ type: "doc", content });

// ─── Real MPA facts (single source for this file) ─────────────────────────────

const SCHOOL = {
  name: "Merciful Paradise Academy",
  short: "MPA",
  motto: "The Future Begins Here",
  lead: "Merciful Paradise Academy is a private, student-centred school committed to strong academics, discipline, moral development and responsible use of technology.",
  history:
    "Founded in 1996 E.C. by Mehari Fisseha Tsadik, MPA has grown from a small school community into one of the recognised private schools in Tigray. The academy serves learners through its Mekelle and Quiha campuses and focuses on preparing students for higher education, responsible citizenship and lifelong learning.",
  vision: "To be a leading center of academic and character excellence, preparing learners for higher education and society.",
  mission:
    "To deliver high-quality general education through competent teachers, effective leadership, stakeholder participation, adequate resources and modern technology while cultivating digitally proficient, morally grounded and responsible learners.",
  values: ["Integrity", "Respect", "Excellence", "Inclusiveness", "Teamwork", "Cultural identity", "Student wellbeing", "Innovation"],
  address: "Mekelle City and Quiha Sub-City, Tigray Region, Ethiopia",
  email: "registrar@mpa.edu.et",
  phone: "+251 971 190 140",
  officeHours: "Monday–Friday, school working hours",
};

// ─── Media ────────────────────────────────────────────────────────────────────

const ASSET_DIR = path.join(process.cwd(), "prisma", "seed-assets");

async function seedMedia(file: string, bucket: string, alt: string, title: string) {
  const storagePath = `seed/${file}`;
  const existing = await db.media.findUnique({ where: { bucket_path: { bucket, path: storagePath } } });
  if (existing) return existing;
  if (!supabase) return null;

  const buffer = await readFile(path.join(ASSET_DIR, file));
  const meta = await sharp(buffer).metadata();
  const mimeType = meta.format === "png" ? "image/png" : "image/jpeg";
  const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, { contentType: mimeType, upsert: true });
  if (error) throw new Error(`Upload ${file}: ${error.message}`);

  return db.media.create({
    data: {
      bucket,
      path: storagePath,
      filename: file,
      title,
      mimeType,
      size: buffer.byteLength,
      width: meta.width ?? null,
      height: meta.height ?? null,
      alt,
      category: "Imported from previous website",
    },
  });
}

async function isEmpty(count: Promise<number>) {
  return (await count) === 0;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (supabase) {
    await ensureBuckets((line) => console.log(`  ${line}`));
  } else {
    console.warn("! Supabase is not configured — skipping storage, images and the admin account.");
  }

  const logo = await seedMedia("logo.png", "site-assets", "Merciful Paradise Academy logo", "MPA logo");
  const favicon = await seedMedia("mpa-icon.png", "site-assets", "Merciful Paradise Academy logo", "MPA icon");
  const campus = await seedMedia(
    "hero.jpg",
    "site-assets",
    "Students in uniform gathered in the courtyard between MPA school buildings",
    "Campus courtyard",
  );
  const poster = await seedMedia(
    "about.jpg",
    "site-assets",
    "MPA students assembled in front of the multi-storey school building, with the school logo and the motto “The Future Begins Here!”",
    "“The Future Begins Here” poster",
  );

  // Site settings (singleton)
  const settings = {
    schoolName: SCHOOL.name,
    shortName: SCHOOL.short,
    tagline: SCHOOL.motto,
    description: SCHOOL.lead,
    foundedYear: "1996 E.C.",
    vision: SCHOOL.vision,
    mission: SCHOOL.mission,
    coreValues: SCHOOL.values,
    phone: SCHOOL.phone,
    email: SCHOOL.email,
    address: SCHOOL.address,
    officeHours: SCHOOL.officeHours,
    socialLinks: [],
    copyright: "© {year} Merciful Paradise Academy. All rights reserved.",
    headerCtaLabel: "Apply / Register",
    headerCtaUrl: "/admissions",
    seoTitle: "Merciful Paradise Academy | The Future Begins Here",
    seoDescription:
      "Merciful Paradise Academy is a private school in Tigray, Ethiopia, serving learners with academic excellence, character formation and technology-enhanced education.",
    logoId: logo?.id ?? null,
    footerLogoId: logo?.id ?? null,
    faviconId: favicon?.id ?? null,
    ogImageId: campus?.id ?? null,
  };
  await db.siteSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...settings },
    // On re-runs only fill in images that were skipped earlier.
    update: {
      logoId: settings.logoId ?? undefined,
      footerLogoId: settings.footerLogoId ?? undefined,
      faviconId: settings.faviconId ?? undefined,
      ogImageId: settings.ogImageId ?? undefined,
    },
  });
  await db.themeSettings.upsert({ where: { id: 1 }, create: { id: 1, ...DEFAULT_THEME }, update: {} });
  console.log("✓ Site settings and theme");

  // Navigation
  if (await isEmpty(db.navigationItem.count())) {
    type NavSeed = { label: string; href?: string; enabled?: boolean; children?: NavSeed[] };
    const header: NavSeed[] = [
      { label: "Home", href: "/" },
      {
        label: "About",
        children: [
          { label: "About MPA", href: "/about" },
          { label: "Our Campuses", href: "/about/campuses" },
          // Enable once staff profiles have been added in Admin → Staff.
          { label: "Leadership", href: "/about/leadership", enabled: false },
        ],
      },
      {
        label: "Academics",
        children: [
          { label: "Programs", href: "/programs" },
          { label: "Student Life", href: "/student-life" },
        ],
      },
      {
        label: "Admissions",
        children: [
          { label: "Admissions & Registration", href: "/admissions" },
          { label: "Frequently Asked Questions", href: "/faq" },
        ],
      },
      { label: "News", href: "/news" },
      { label: "Events", href: "/events" },
      { label: "Gallery", href: "/gallery" },
      { label: "Contact", href: "/contact" },
    ];
    const footer: NavSeed[] = [
      { label: "About MPA", href: "/about" },
      { label: "Admissions", href: "/admissions" },
      { label: "News", href: "/news" },
      { label: "Events", href: "/events" },
      { label: "FAQs", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ];
    const legal: NavSeed[] = [{ label: "Privacy Policy", href: "/privacy" }];

    const create = async (location: "HEADER" | "FOOTER" | "LEGAL", items: NavSeed[], parentId?: string) => {
      for (const [index, item] of items.entries()) {
        const row = await db.navigationItem.create({
          data: {
            location,
            label: item.label,
            href: item.href ?? null,
            enabled: item.enabled ?? true,
            sortOrder: index,
            parentId,
          },
        });
        if (item.children) await create(location, item.children, row.id);
      }
    };
    await create("HEADER", header);
    await create("FOOTER", footer);
    await create("LEGAL", legal);
    console.log("✓ Navigation");
  }

  // Standalone pages (all editable in Admin → Pages)
  if (await isEmpty(db.page.count())) {
    const pages: Prisma.PageCreateInput[] = [
      {
        slug: "about",
        eyebrow: "About MPA",
        title: "Welcome to Merciful Paradise Academy",
        intro: SCHOOL.lead,
        content: doc(h2("Our history"), p(SCHOOL.history)),
        seoDescription: SCHOOL.lead,
      },
      {
        slug: "campuses",
        eyebrow: "About MPA",
        title: "Our Campuses",
        intro: "MPA serves families in Mekelle City and Quiha Sub-City, Tigray Region, Ethiopia.",
      },
      {
        slug: "leadership",
        eyebrow: "About MPA",
        title: "Leadership & Staff",
        intro: "The people who lead teaching, learning and school life at Merciful Paradise Academy.",
      },
      {
        slug: "programs",
        eyebrow: "Academics",
        title: "Academic Programmes",
        intro:
          "MPA provides structured general education with a strong focus on literacy, numeracy, science, technology, discipline and exam readiness.",
      },
      {
        slug: "student-life",
        eyebrow: "Community",
        title: "School Life and Events",
        intro: "MPA encourages students to participate in academic, cultural and character-building activities.",
      },
      {
        slug: "admissions",
        eyebrow: "Admissions",
        title: "Admissions and Registration",
        intro:
          "Parents and guardians are welcome to contact the registrar office for placement, documentation and fee guidance.",
        content: doc(
          h2("What to prepare"),
          ul(["Previous school records", "Identification documents", "Parent or guardian contact details"]),
          h2("Fees and payments"),
          p("For exact tuition and payment instructions, please contact the registrar or finance office."),
        ),
      },
      {
        slug: "faq",
        eyebrow: "Admissions",
        title: "Frequently Asked Questions",
        intro: "Answers to common questions from parents, students and visitors.",
      },
      {
        slug: "news",
        eyebrow: "News",
        title: "News & Announcements",
        intro: "Updates and announcements from Merciful Paradise Academy.",
      },
      { slug: "events", eyebrow: "Events", title: "Events", intro: "Upcoming and past events at MPA." },
      { slug: "gallery", eyebrow: "Gallery", title: "Gallery", intro: "Photos from life at Merciful Paradise Academy." },
      {
        slug: "contact",
        eyebrow: "Contact",
        title: "Contact Merciful Paradise Academy",
        intro: "For admissions, school records, parent communication or general information, contact the school office.",
      },
      {
        slug: "privacy",
        title: "Privacy Policy",
        intro: "How this website handles the information you share with Merciful Paradise Academy.",
        // Describes what this software actually does. The school should review it.
        content: doc(
          h2("Contact form"),
          p(
            "When you send a message through the contact form, we store your name, email address, phone number (if provided), subject and message so that school staff can reply. Messages are only visible to authorised website administrators.",
          ),
          p(
            "To prevent spam, we keep a one-way hashed version of your IP address with each message. It cannot be used to identify you and is used only to limit repeated submissions.",
          ),
          h2("Cookies"),
          p(
            "The public website does not use advertising or tracking cookies. Sign-in cookies are used only by website administrators.",
          ),
          h2("Contact"),
          p(`For questions about your information, contact the school office at ${SCHOOL.email}.`),
        ),
      },
    ];
    for (const page of pages) {
      await db.page.create({
        data: { ...page, status: "PUBLISHED", publishedAt: new Date() },
      });
    }
    console.log("✓ Pages");
  }

  // Homepage sections (order = sortOrder)
  if (await isEmpty(db.homepageSection.count())) {
    const sections: Omit<Prisma.HomepageSectionCreateManyInput, "sortOrder">[] = [
      { key: "HERO" },
      { key: "STATISTICS" },
      {
        key: "ABOUT",
        eyebrow: "About MPA",
        title: "Welcome to Merciful Paradise Academy",
        description: SCHOOL.lead,
        imageId: poster?.id ?? null,
        ctaLabel: "Discover MPA",
        ctaUrl: "/about",
      },
      {
        key: "PROGRAMS",
        eyebrow: "Academics",
        title: "Academic Programmes",
        description:
          "MPA provides structured general education with a strong focus on literacy, numeracy, science, technology, discipline and exam readiness.",
        ctaLabel: "All programmes",
        ctaUrl: "/programs",
        itemLimit: 3,
      },
      {
        key: "WHY_MPA",
        eyebrow: "Why choose MPA?",
        title: "Balanced learning for the whole child",
        description: "MPA combines academic expectations with discipline, safety, values and student growth.",
      },
      {
        key: "STUDENT_LIFE",
        eyebrow: "Community",
        title: "School Life and Events",
        description: "MPA encourages students to participate in academic, cultural and character-building activities.",
        ctaLabel: "Student life",
        ctaUrl: "/student-life",
      },
      { key: "NEWS", eyebrow: "News", title: "Latest news", ctaLabel: "All news", ctaUrl: "/news", itemLimit: 3 },
      { key: "EVENTS", eyebrow: "Events", title: "Upcoming events", ctaLabel: "All events", ctaUrl: "/events", itemLimit: 3 },
      { key: "GALLERY", eyebrow: "Gallery", title: "Life at MPA", ctaLabel: "View gallery", ctaUrl: "/gallery", itemLimit: 6 },
      {
        key: "CTA",
        title: "Admissions and Registration",
        description:
          "Parents and guardians are welcome to contact the registrar office for placement, documentation and fee guidance.",
        ctaLabel: "Apply / Register",
        ctaUrl: "/admissions",
        secondaryCtaLabel: "Contact the registrar",
        secondaryCtaUrl: "/contact",
      },
    ];
    await db.homepageSection.createMany({ data: sections.map((s, sortOrder) => ({ ...s, sortOrder })) });
    console.log("✓ Homepage sections");
  }

  if (await isEmpty(db.heroSlide.count())) {
    await db.heroSlide.create({
      data: {
        eyebrow: "Private school in Tigray, Ethiopia",
        title: SCHOOL.motto,
        description:
          "A safe, disciplined and technology-enhanced learning community where academic excellence and character development grow together.",
        imageId: campus?.id ?? null,
        primaryLabel: "Apply / Register",
        primaryUrl: "/admissions",
        secondaryLabel: "Discover MPA",
        secondaryUrl: "/about",
      },
    });
    console.log("✓ Hero slide");
  }

  if (await isEmpty(db.statistic.count())) {
    const stats = [
      { value: "1996 E.C.", label: "Founded", icon: "landmark" },
      { value: "G1–12", label: "Mekelle Campus", icon: "school" },
      { value: "G1–8", label: "Quiha Campus", icon: "school" },
      { value: "100%", label: "Strong Grade 12 pass record", icon: "award" },
    ];
    await db.statistic.createMany({ data: stats.map((s, sortOrder) => ({ ...s, sortOrder })) });
    console.log("✓ Statistics");
  }

  if (await isEmpty(db.highlight.count())) {
    const highlights: Omit<Prisma.HighlightCreateManyInput, "sortOrder">[][] = [
      [
        { group: "WHY_MPA", icon: "shield-check", title: "Safe and inclusive campus", text: "A learning environment that supports students’ physical, emotional and academic wellbeing." },
        { group: "WHY_MPA", icon: "book-open", title: "Strong academic culture", text: "Clear expectations, exam preparation, classroom follow-up and performance monitoring." },
        { group: "WHY_MPA", icon: "users", title: "Activities and student growth", text: "Programmes that encourage confidence, communication, creativity and teamwork." },
        { group: "WHY_MPA", icon: "monitor-smartphone", title: "Technology-enhanced learning", text: "Digital communication, school management tools and learning-support systems." },
      ],
      [
        { group: "STUDENT_LIFE", icon: "heart-handshake", title: "Parents’ Day", text: "A regular school-family engagement programme to review progress and celebrate student development." },
        { group: "STUDENT_LIFE", icon: "sparkles", title: "Student Activities", text: "Activities that support confidence, leadership, creativity and responsible participation." },
      ],
      [
        { group: "ADMISSION_STEP", title: "Contact the registrar office", text: "Contact the registrar office and identify the required grade level." },
        { group: "ADMISSION_STEP", title: "Prepare your documents", text: "Prepare previous school records, identification documents and parent or guardian contact details." },
        { group: "ADMISSION_STEP", title: "Complete registration", text: "Complete registration and receive school communication channel guidance." },
      ],
      [
        { group: "CAMPUS", icon: "school", title: "Mekelle Campus", subtitle: "Grades 1–12", text: "Serves learners from Grade 1 through Grade 12 in Mekelle City." },
        { group: "CAMPUS", icon: "school", title: "Quiha Campus", subtitle: "Grades 1–8", text: "Serves learners from Grade 1 through Grade 8 in Quiha Sub-City." },
      ],
    ];
    await db.highlight.createMany({
      data: highlights.flatMap((group) => group.map((item, sortOrder) => ({ ...item, sortOrder }))),
    });
    console.log("✓ Highlights (Why MPA, student life, admission steps, campuses)");
  }

  if (await isEmpty(db.program.count())) {
    const programs = [
      {
        title: "Primary Education",
        slug: "primary-education",
        gradeRange: "Grades 1–8",
        shortDescription: "Strong foundations in language, mathematics, science, social studies, values and study habits.",
      },
      {
        title: "Secondary Education",
        slug: "secondary-education",
        gradeRange: "Grades 9–12 at Mekelle Campus",
        shortDescription: "Focused preparation for national examinations, higher education and responsible digital learning.",
      },
      {
        title: "Character and Life Skills",
        slug: "character-and-life-skills",
        gradeRange: "All levels",
        shortDescription:
          "Discipline, leadership, communication, collaboration, creativity and problem-solving are built into school life.",
      },
    ];
    for (const [sortOrder, program] of programs.entries()) {
      await db.program.create({
        data: {
          ...program,
          description: doc(p(program.shortDescription)),
          status: "PUBLISHED",
          featured: true,
          sortOrder,
          publishedAt: new Date(),
        },
      });
    }
    console.log("✓ Programs");
  }

  if (await isEmpty(db.articleCategory.count())) {
    await db.articleCategory.createMany({
      data: [
        { name: "Announcements", slug: "announcements", sortOrder: 0 },
        { name: "School News", slug: "school-news", sortOrder: 1 },
      ],
    });
  }

  if (await isEmpty(db.article.count())) {
    const announcements = await db.articleCategory.findUniqueOrThrow({ where: { slug: "announcements" } });
    const articles = [
      {
        title: "New and returning student registration is open",
        slug: "registration-is-open",
        excerpt:
          "Families can contact the registrar office for admission requirements, available grades and payment guidance.",
      },
      {
        title: "MPA mobile app and SMS communication",
        slug: "mobile-app-and-sms-communication",
        excerpt:
          "Parents can receive announcements, billing updates and school information through the school’s digital communication channels.",
      },
    ];
    for (const article of articles) {
      await db.article.create({
        data: {
          ...article,
          content: doc(p(article.excerpt)),
          authorName: "MPA Registrar Office",
          categoryId: announcements.id,
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });
    }
    console.log("✓ Articles (announcements)");
  }

  if (await isEmpty(db.faq.count())) {
    const faqs: [category: string, question: string, answer: string][] = [
      ["About MPA", "What is Merciful Paradise Academy?", "Merciful Paradise Academy, also known as MPA, is a private school in Tigray, Ethiopia. It focuses on academic excellence, discipline, character development, student wellbeing and responsible use of technology. Its motto is: The Future Begins Here."],
      ["About MPA", "When was MPA founded, and by whom?", "Merciful Paradise Academy was founded in 1996 E.C. by Mehari Fisseha Tsadik. It began with a small school community and later expanded into campuses serving students in Mekelle and Quiha."],
      ["About MPA", "Where is MPA located?", "MPA serves families in Mekelle City and Quiha Sub-City, Tigray Region, Ethiopia. The Mekelle campus serves Grades 1–12, while the Quiha campus serves Grades 1–8."],
      ["About MPA", "What are MPA’s core values?", "MPA values include integrity, respect, excellence, inclusiveness, teamwork, cultural identity, student wellbeing and innovation."],
      ["Academics", "Which grades does MPA teach?", "MPA offers Grades 1–12 at the Mekelle campus and Grades 1–8 at the Quiha campus. There is no KG programme at MPA."],
      ["Academics", "What is MPA’s academic focus?", "MPA focuses on strong classroom learning, discipline, exam readiness, literacy, numeracy, science, values-based education and higher education preparation. The school also gives attention to Grade 12 exam performance."],
      ["Academics", "How does MPA approach safety and discipline?", "MPA aims to provide a safe and inclusive campus with clear expectations, discipline, student wellbeing and respectful behaviour. The school encourages both academic and character growth."],
      ["Academics", "What activities does MPA offer?", "MPA organises school-family engagement and student development activities, including Parents’ Day, student programmes and activities that support leadership, confidence, teamwork and character development."],
      ["Admissions", "How can I register a student?", "To register a student, contact the registrar office, confirm the available grade level, prepare previous school records and identification documents, complete the registration process and receive guidance about school communication channels."],
      ["Admissions", "How are school fees paid?", "For exact tuition and payment instructions, please contact the registrar or finance office. MPA can communicate billing information to parents through official school channels such as SMS and app notices."],
      ["Parents", "How does the school communicate with parents?", "MPA communicates with parents through official school notices, SMS, the mobile app where available and direct communication from the school office or teachers."],
      ["Parents", "Does MPA use a mobile app or SMS?", "MPA uses digital communication tools, including school management features, mobile app communication and SMS notices for parents."],
      ["Contact", "How can I contact MPA?", `For admissions, records or general information, contact the registrar office at ${SCHOOL.email} or ${SCHOOL.phone}. The school is located in Mekelle City and Quiha Sub-City, Tigray Region, Ethiopia.`],
    ];
    await db.faq.createMany({
      data: faqs.map(([category, question, answer], sortOrder) => ({
        category,
        question,
        answer,
        sortOrder,
        status: "PUBLISHED" as const,
      })),
    });
    console.log("✓ FAQs (from the previous chatbot knowledge base)");
  }

  await seedSuperAdmin();
}

async function seedSuperAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Website Administrator";
  if (!supabase || !email || !password) {
    console.warn("! SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set (or no Supabase) — skipping the super admin.");
    return;
  }
  if (password.length < 12) throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");

  let userId: string | undefined;
  const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.data.user) {
    userId = created.data.user.id;
  } else {
    // Already exists: look it up rather than resetting its password.
    for (let page = 1; !userId && page < 50; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
      if (data.users.length < 200) break;
    }
    if (!userId) throw new Error(`Could not create or find auth user ${email}: ${created.error?.message}`);
  }

  await db.adminUser.upsert({
    where: { id: userId },
    create: { id: userId, email, name, role: "SUPER_ADMIN" },
    update: { role: "SUPER_ADMIN", active: true },
  });
  console.log(`✓ Super admin ${email}`);
}

main()
  .then(() => console.log("Seed complete."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
