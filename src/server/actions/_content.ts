import "server-only";
import { db } from "@/lib/db";

/** Minimal shape shared by the Prisma delegates used below. */
type Delegate = {
  findUnique(args: { where: { id: string }; select?: Record<string, boolean> }): Promise<Record<string, unknown> | null>;
  findMany(args: { where?: Record<string, unknown>; orderBy?: unknown; select?: Record<string, boolean> }): Promise<{ id: string }[]>;
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<Record<string, unknown>>;
};

const STATUS_MODELS = {
  article: { delegate: () => db.article, hasPublishedAt: true },
  program: { delegate: () => db.program, hasPublishedAt: true },
  event: { delegate: () => db.event, hasPublishedAt: true },
  galleryAlbum: { delegate: () => db.galleryAlbum, hasPublishedAt: true },
  page: { delegate: () => db.page, hasPublishedAt: true },
  staffMember: { delegate: () => db.staffMember, hasPublishedAt: false },
  faq: { delegate: () => db.faq, hasPublishedAt: false },
} as const;

export type StatusModel = keyof typeof STATUS_MODELS;
export type ContentStatusValue = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/** Changes status; publishing something with no date stamps it "now". Returns the updated row. */
export async function changeStatus(model: StatusModel, id: string, status: ContentStatusValue) {
  const config = STATUS_MODELS[model];
  const delegate = config.delegate() as unknown as Delegate;
  const data: Record<string, unknown> = { status };
  if (config.hasPublishedAt && status === "PUBLISHED") {
    const current = await delegate.findUnique({ where: { id }, select: { publishedAt: true } });
    if (!current?.publishedAt) data.publishedAt = new Date();
  }
  return delegate.update({ where: { id }, data });
}

/** Publication date to store when saving a form. */
export function resolvePublishedAt(status: ContentStatusValue, requested: Date | null, existing?: Date | null): Date | null {
  if (requested) return requested;
  if (status === "PUBLISHED") return existing ?? new Date();
  return existing ?? null;
}

const ORDER_MODELS = {
  program: { delegate: () => db.program, scope: [] as string[] },
  faq: { delegate: () => db.faq, scope: [] as string[] },
  staffMember: { delegate: () => db.staffMember, scope: [] as string[] },
  galleryAlbum: { delegate: () => db.galleryAlbum, scope: [] as string[] },
  galleryItem: { delegate: () => db.galleryItem, scope: ["albumId"] },
  heroSlide: { delegate: () => db.heroSlide, scope: [] as string[] },
  homepageSection: { delegate: () => db.homepageSection, scope: [] as string[] },
  highlight: { delegate: () => db.highlight, scope: ["group"] },
  statistic: { delegate: () => db.statistic, scope: [] as string[] },
  navigationItem: { delegate: () => db.navigationItem, scope: ["location", "parentId"] },
  articleCategory: { delegate: () => db.articleCategory, scope: [] as string[] },
} as const;

export type OrderModel = keyof typeof ORDER_MODELS;

/**
 * Moves an item one place up or down among its siblings (same group / parent),
 * then rewrites sortOrder 0..n so the order is always clean.
 */
export async function moveItem(model: OrderModel, id: string, direction: "up" | "down") {
  const config = ORDER_MODELS[model];
  const delegate = config.delegate() as unknown as Delegate;
  const select = Object.fromEntries([["id", true], ...config.scope.map((k) => [k, true])]);
  const item = await delegate.findUnique({ where: { id }, select });
  if (!item) return;
  const where = Object.fromEntries(config.scope.map((k) => [k, item[k] ?? null]));
  const siblings = await delegate.findMany({ where, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true } });
  const index = siblings.findIndex((s) => s.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= siblings.length) return;
  [siblings[index], siblings[target]] = [siblings[target], siblings[index]];
  await db.$transaction(
    siblings.map((s, sortOrder) => (delegate.update({ where: { id: s.id }, data: { sortOrder } }) as unknown) as ReturnType<typeof db.faq.update>),
  );
}

/** Next sortOrder value for appending a new item to a list. */
export async function nextSortOrder(model: OrderModel, where: Record<string, unknown> = {}) {
  const delegate = ORDER_MODELS[model].delegate() as unknown as {
    aggregate(args: { where: Record<string, unknown>; _max: { sortOrder: true } }): Promise<{ _max: { sortOrder: number | null } }>;
  };
  const { _max } = await delegate.aggregate({ where, _max: { sortOrder: true } });
  return (_max.sortOrder ?? -1) + 1;
}
