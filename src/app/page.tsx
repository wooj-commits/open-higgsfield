import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";

import { getSession } from "@/auth/guard";
import { OpenHiggsfieldApp } from "@/openhiggsfield/openhiggsfield-app";

import "@/openhiggsfield/openhiggsfield.css";

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
  alternates: { canonical: "/" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OpenHiggsfieldPage() {
  const session = await getSession();
  return (
    <OpenHiggsfieldApp
      fontClassName={`${inter.variable} ${display.variable}`}
      username={session?.username ?? ""}
    />
  );
}
