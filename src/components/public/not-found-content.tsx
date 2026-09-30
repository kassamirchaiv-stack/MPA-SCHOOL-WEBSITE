import Link from "next/link";

export function NotFoundContent() {
  return (
    <section className="container-site py-24 text-center sm:py-32">
      <p className="font-display text-7xl text-accent sm:text-8xl">404</p>
      <h1 className="mt-6 text-3xl sm:text-4xl">We couldn’t find that page</h1>
      <p className="mx-auto mt-4 max-w-lg text-lg text-muted">
        The page may have moved, or the link may be out of date. Try one of these instead:
      </p>
      <ul className="mt-10 flex flex-wrap justify-center gap-3">
        <li>
          <Link href="/" className="btn btn-primary">
            Homepage
          </Link>
        </li>
        <li>
          <Link href="/admissions" className="btn btn-outline">
            Admissions
          </Link>
        </li>
        <li>
          <Link href="/news" className="btn btn-outline">
            News
          </Link>
        </li>
        <li>
          <Link href="/contact" className="btn btn-outline">
            Contact us
          </Link>
        </li>
      </ul>
    </section>
  );
}
