import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { readAuthConfig } from "@/auth/config";
import { SITE_NAME } from "@/site";

import { SignInForm } from "./sign-in-form";
import "./sign-in.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-ohf-inter",
  display: "swap",
});

const display = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-ohf-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const config = readAuthConfig();
  const misconfigured = "missing" in config ? config.missing : [];
  const { next } = await searchParams;

  return (
    <div className={`ohf-signin ${inter.variable} ${display.variable}`}>
      <div className="ohf-signin-glow" aria-hidden />
      <div className="ohf-signin-grain" aria-hidden />
      <main className="ohf-signin-main">
        <p className="ohf-signin-kicker">Private studio</p>
        <h1 className="ohf-signin-title">{SITE_NAME}</h1>
        <p className="ohf-signin-lede">
          One prompt bar. Every model’s own settings. Image and video, in one gallery.
        </p>
        <SignInForm nextPath={typeof next === "string" ? next : "/"} missing={misconfigured} />
      </main>
    </div>
  );
}
