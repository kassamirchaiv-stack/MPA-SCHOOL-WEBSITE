import Image from "next/image";
import type { ReactNode } from "react";
import { publicEnv } from "@/lib/env";
import { cn, safeHref } from "@/lib/utils";

/**
 * Renders Tiptap JSON as React elements through an explicit whitelist. Unknown
 * nodes and marks are dropped, links are sanitised and no raw HTML is ever
 * injected, so editor content cannot execute script.
 */

type Mark = { type: string; attrs?: Record<string, unknown> };
type TNode = { type: string; text?: string; attrs?: Record<string, unknown>; marks?: Mark[]; content?: TNode[] };

function isNode(value: unknown): value is TNode {
  return typeof value === "object" && value !== null && typeof (value as TNode).type === "string";
}

function renderMarks(text: ReactNode, marks: Mark[] | undefined, key: string): ReactNode {
  if (!marks) return text;
  return marks.reduce<ReactNode>((acc, mark, i) => {
    const k = `${key}-m${i}`;
    switch (mark.type) {
      case "bold":
        return <strong key={k}>{acc}</strong>;
      case "italic":
        return <em key={k}>{acc}</em>;
      case "underline":
        return <u key={k}>{acc}</u>;
      case "strike":
        return <s key={k}>{acc}</s>;
      case "code":
        return <code key={k}>{acc}</code>;
      case "link": {
        const href = safeHref(String(mark.attrs?.href ?? ""));
        if (!href) return acc;
        const external = !href.startsWith("/") && !href.startsWith("#");
        return (
          <a key={k} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {acc}
          </a>
        );
      }
      default:
        return acc;
    }
  }, text);
}

/** Only images served from our own Supabase Storage are rendered. */
function safeImageSrc(src: unknown): string | null {
  if (typeof src !== "string") return null;
  if (src.startsWith(`${publicEnv.supabaseUrl}/storage/v1/object/public/`)) return src;
  return null;
}

function renderChildren(nodes: TNode[] | undefined, key: string): ReactNode[] {
  return (nodes ?? []).filter(isNode).map((node, i) => renderNode(node, `${key}-${i}`));
}

function renderNode(node: TNode, key: string): ReactNode {
  const children = () => renderChildren(node.content, key);
  switch (node.type) {
    case "doc":
      return <>{children()}</>;
    case "text":
      return renderMarks(node.text ?? "", node.marks, key);
    case "paragraph":
      return <p key={key}>{children()}</p>;
    case "heading": {
      const level = Number(node.attrs?.level);
      // Page titles are h1, so content headings start at h2.
      if (level >= 4) return <h4 key={key}>{children()}</h4>;
      if (level === 3) return <h3 key={key}>{children()}</h3>;
      return <h2 key={key}>{children()}</h2>;
    }
    case "bulletList":
      return <ul key={key}>{children()}</ul>;
    case "orderedList":
      return <ol key={key}>{children()}</ol>;
    case "listItem":
      return <li key={key}>{children()}</li>;
    case "blockquote":
      return <blockquote key={key}>{children()}</blockquote>;
    case "horizontalRule":
      return <hr key={key} />;
    case "hardBreak":
      return <br key={key} />;
    case "image": {
      const src = safeImageSrc(node.attrs?.src);
      if (!src) return null;
      const width = Number(node.attrs?.width) || 1200;
      const height = Number(node.attrs?.height) || 800;
      return (
        <figure key={key}>
          <Image
            src={src}
            alt={String(node.attrs?.alt ?? "")}
            width={width}
            height={height}
            sizes="(min-width: 768px) 720px, 100vw"
          />
          {typeof node.attrs?.title === "string" && node.attrs.title && <figcaption>{node.attrs.title}</figcaption>}
        </figure>
      );
    }
    default:
      return null;
  }
}

export function hasRichText(content: unknown): boolean {
  return isNode(content) && Array.isArray(content.content) && content.content.some((n) => isNode(n) && (n.type !== "paragraph" || (n.content?.length ?? 0) > 0));
}

export function RichText({ content, className }: { content: unknown; className?: string }) {
  if (!isNode(content)) return null;
  return <div className={cn("prose-mpa", className)}>{renderNode(content, "rt")}</div>;
}
