"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { reorderItem } from "@/server/actions/reorder";
import type { OrderModel } from "@/server/actions/_content";
import { Button } from "./ui";

export function ReorderButtons({
  model,
  id,
  isFirst,
  isLast,
  label,
}: {
  model: OrderModel;
  id: string;
  isFirst: boolean;
  isLast: boolean;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const move = (direction: "up" | "down") =>
    startTransition(async () => {
      const result = await reorderItem({ model, id, direction });
      if (!result.ok) toast.error(result.error);
      else router.refresh();
    });

  return (
    <div className="flex gap-0.5">
      <Button variant="ghost" size="icon" className="size-8" disabled={isFirst || pending} onClick={() => move("up")} aria-label={`Move “${label}” up`}>
        <ArrowUp aria-hidden className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" className="size-8" disabled={isLast || pending} onClick={() => move("down")} aria-label={`Move “${label}” down`}>
        <ArrowDown aria-hidden className="size-4" />
      </Button>
    </div>
  );
}
