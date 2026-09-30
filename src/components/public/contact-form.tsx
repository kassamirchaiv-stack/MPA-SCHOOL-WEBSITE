"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { contactSchema, type ContactInput } from "@/lib/validation/contact";
import { submitContact } from "@/server/actions/contact";
import { cn } from "@/lib/utils";

const inputClass =
  "block w-full rounded-btn border border-border bg-surface px-4 py-3 text-base text-text placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none aria-invalid:border-red-500";

function FormField({
  id,
  label,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function ContactForm() {
  // When the form became usable; submissions faster than a few seconds are treated as bots.
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const started = startedAt.current;
    void handleSubmit((values) => send(values, started))(event);
  };

  const send = (values: ContactInput, started: number) => {
    setServerError(null);
    startTransition(async () => {
      const result = await submitContact(values, { website: honeypot, startedAt: started });
      if (result.ok) {
        reset();
        setStatus("sent");
        return;
      }
      setServerError(result.error);
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        setError(field as keyof ContactInput, { message });
      }
    });
  };

  if (status === "sent") {
    return (
      <div role="status" className="rounded-card border border-primary/30 bg-primary/5 p-8 text-center">
        <CheckCircle2 aria-hidden className="mx-auto size-10 text-primary" />
        <p className="mt-4 font-display text-2xl">Thank you — your message has been sent.</p>
        <p className="mt-2 text-muted">The school office will reply as soon as possible.</p>
        <button type="button" onClick={() => setStatus("idle")} className="mt-6 font-semibold text-primary underline underline-offset-4">
          Send another message
        </button>
      </div>
    );
  }

  const describedBy = (field: keyof ContactInput) => (errors[field] ? `${field}-error` : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {serverError && (
        <p role="alert" className="rounded-btn border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {serverError}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="name" label="Full name" error={errors.name?.message}>
          <input id="name" autoComplete="name" className={inputClass} aria-invalid={!!errors.name} aria-describedby={describedBy("name")} {...register("name")} />
        </FormField>
        <FormField id="email" label="Email" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" className={inputClass} aria-invalid={!!errors.email} aria-describedby={describedBy("email")} {...register("email")} />
        </FormField>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="phone" label="Phone" optional error={errors.phone?.message}>
          <input id="phone" type="tel" autoComplete="tel" className={inputClass} aria-invalid={!!errors.phone} aria-describedby={describedBy("phone")} {...register("phone")} />
        </FormField>
        <FormField id="subject" label="Subject" error={errors.subject?.message}>
          <input id="subject" className={inputClass} aria-invalid={!!errors.subject} aria-describedby={describedBy("subject")} {...register("subject")} />
        </FormField>
      </div>
      <FormField id="message" label="Message" error={errors.message?.message}>
        <textarea id="message" rows={6} className={cn(inputClass, "resize-y")} aria-invalid={!!errors.message} aria-describedby={describedBy("message")} {...register("message")} />
      </FormField>

      {/* Honeypot: visually hidden and skipped by keyboard and screen readers. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </label>
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary w-full sm:w-auto disabled:opacity-60">
        {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
        Send message
      </button>
    </form>
  );
}
