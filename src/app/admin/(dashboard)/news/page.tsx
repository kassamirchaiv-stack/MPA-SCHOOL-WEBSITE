import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Tags } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { formatShortDate } from "@/lib/format";
import { PageHeader } from "@/components/admin/page-header";
import {
  AdminPagination,
  ButtonLink,
  EmptyRow,
  ListToolbar,
  STATUS_OPTIONS,
  StatusBadge,
  TableWrap,
  contentStatus,
  hrefWith,
  listParams,
  selectClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/admin/ui";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { deleteArticle, setArticleStatus } from "@/server/actions/articles";

export const metadata: Metadata = { title: "News" };

const PAGE_SIZE = 20;

export default async function AdminNewsPage({ searchParams }: PageProps<"/admin/news">) {
  await requireAdminPage("news.manage");
  const sp = await searchParams;
  const { q, status, page } = listParams(sp);
  const category = typeof sp.category === "string" && sp.category ? sp.category : undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(category ? { categoryId: category } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { excerpt: { contains: q, mode: "insensitive" as const } }] } : {}),
  };
  const [articles, total, categories] = await Promise.all([
    db.article.findMany({
      where,
      orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }, { updatedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, title: true, slug: true, status: true, publishedAt: true, updatedAt: true, category: { select: { name: true } } },
    }),
    db.article.count({ where }),
    db.articleCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="News"
        description="Articles and announcements shown on the website."
        actions={
          <>
            <ButtonLink href="/admin/news/categories" variant="secondary">
              <Tags aria-hidden className="size-4" /> Categories
            </ButtonLink>
            <ButtonLink href="/admin/news/new">
              <Plus aria-hidden className="size-4" /> New article
            </ButtonLink>
          </>
        }
      />
      <ListToolbar
        q={q}
        status={status}
        statusOptions={STATUS_OPTIONS}
        placeholder="Search articles"
        extra={
          <>
            <label className="contents">
              <span className="sr-only">Category</span>
              <select name="category" defaultValue={category ?? ""} className={`${selectClass} w-auto`}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        }
      />
      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Title</th>
              <th className={`${thClass} hidden md:table-cell`}>Category</th>
              <th className={thClass}>Status</th>
              <th className={`${thClass} hidden sm:table-cell`}>Date</th>
              <th className={`${thClass} text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 && (
              <EmptyRow colSpan={5}>
                {q || status || category ? "No articles match these filters." : "No articles yet. Create the first one."}
              </EmptyRow>
            )}
            {articles.map((a) => (
              <tr key={a.id} className="hover:bg-zinc-50">
                <td className={tdClass}>
                  <Link href={`/admin/news/${a.id}`} className="font-medium text-zinc-900 hover:underline">
                    {a.title}
                  </Link>
                  <p className="text-xs text-zinc-500">/news/{a.slug}</p>
                </td>
                <td className={`${tdClass} hidden text-zinc-600 md:table-cell`}>{a.category?.name ?? "—"}</td>
                <td className={tdClass}>
                  <StatusBadge status={contentStatus(a.status, a.publishedAt)} />
                </td>
                <td className={`${tdClass} hidden text-zinc-600 sm:table-cell`}>{formatShortDate(a.publishedAt ?? a.updatedAt)}</td>
                <td className={`${tdClass} text-right`}>
                  <ContentRowActions
                    id={a.id}
                    label={a.title}
                    status={a.status}
                    editHref={`/admin/news/${a.id}`}
                    previewHref={`/admin/preview/news/${a.id}`}
                    setStatus={setArticleStatus}
                    remove={deleteArticle}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <AdminPagination page={page} pageCount={pageCount} hrefFor={(p) => hrefWith("/admin/news", { q, status, category, page: p })} />
    </>
  );
}
