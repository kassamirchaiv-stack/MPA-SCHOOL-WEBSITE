import { ArrowRight } from "lucide-react";
import { SmartLink } from "@/components/ui/smart-link";
import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  action?: { label: string | null; href: string | null } | null;
  align?: "left" | "center";
  inverted?: boolean;
  as?: "h1" | "h2";
  id?: string;
  className?: string;
};

export function SectionHeader({ eyebrow, title, description, action, align = "left", inverted, as = "h2", id, className }: Props) {
  const Heading = as;
  const showAction = action?.label && action.href;
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-6 lg:mb-14",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && (
          <p className={cn("eyebrow mb-3 flex items-center gap-3", align === "center" && "justify-center", inverted && "text-accent")}>
            <span aria-hidden className="h-px w-8 bg-accent" />
            {eyebrow}
          </p>
        )}
        {title && (
          <Heading id={id} className="text-3xl sm:text-4xl lg:text-[2.75rem]">
            {title}
          </Heading>
        )}
        {description && (
          <p className={cn("mt-4 text-lg", inverted ? "text-on-secondary/80" : "text-muted")}>{description}</p>
        )}
      </div>
      {showAction && (
        <SmartLink
          href={action.href}
          className={cn(
            "group inline-flex shrink-0 items-center gap-2 font-semibold",
            inverted ? "text-accent" : "text-primary",
          )}
        >
          {action.label}
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
        </SmartLink>
      )}
    </div>
  );
}
