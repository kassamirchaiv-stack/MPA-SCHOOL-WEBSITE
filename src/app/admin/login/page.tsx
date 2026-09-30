import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { getSiteSettings } from "@/server/queries/site";
import { mediaUrl } from "@/lib/media";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const settings = await getSiteSettings();
  return (
    <main className="grid min-h-dvh place-items-center bg-zinc-100 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          {settings?.logo && (
            <Image
              src={mediaUrl(settings.logo)}
              alt=""
              width={settings.logo.width ?? 96}
              height={settings.logo.height ?? 96}
              className="mb-4 size-16 object-contain"
              priority
            />
          )}
          <h1 className="font-sans text-xl font-semibold text-zinc-900">
            {settings?.schoolName ?? "Website"} admin
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to manage the website.</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
