import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { safeHref } from "@/lib/utils";

type Props = Omit<ComponentProps<"a">, "href"> & {
  href: string | null | undefined;
  external?: boolean;
  newTab?: boolean;
  children: ReactNode;
};

/** Renders CMS-provided links: next/link for internal paths, <a> for everything else. */
export function SmartLink({ href, external, newTab, children, ...rest }: Props) {
  const safe = safeHref(href);
  if (!safe) return <span {...(rest as ComponentProps<"span">)}>{children}</span>;
  const isInternal = safe.startsWith("/") && !external;
  const tabProps = newTab ? { target: "_blank", rel: "noopener noreferrer" } : {};
  if (isInternal) {
    return (
      <Link href={safe} {...tabProps} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={safe} {...tabProps} {...rest}>
      {children}
    </a>
  );
}
