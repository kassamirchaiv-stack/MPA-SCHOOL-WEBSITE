"use client";

import Link from "next/link";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="container-site py-24 text-center sm:py-32">
      <h1 className="text-3xl sm:text-4xl">Something went wrong</h1>
      <p className="mx-auto mt-4 max-w-lg text-lg text-muted">
        This page could not be loaded right now. Please try again in a moment.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-outline">
          Go to the homepage
        </Link>
      </div>
    </section>
  );
}
