import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  APP_NAME,
  APP_TAGLINE,
  APP_DESCRIPTION,
  ROOT_URL,
} from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

// fc:miniapp embed meta tag content
const fcMiniappEmbed = JSON.stringify({
  version: "1",
  imageUrl: `${ROOT_URL}/assets/embed.png`,
  buttonTitle: "Play",
  action: {
    type: "launch_frame",
    name: APP_NAME,
    url: ROOT_URL,
    splashImageUrl: `${ROOT_URL}/assets/splash.png`,
    splashBackgroundColor: "#0a0a0f",
  },
});

export const metadata: Metadata = {
  title: `${APP_NAME} - ${APP_TAGLINE}`,
  description: APP_DESCRIPTION,
  metadataBase: new URL(ROOT_URL),
  openGraph: {
    title: `${APP_NAME} - ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: `${ROOT_URL}/assets/hero.png`,
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    images: [`${ROOT_URL}/assets/hero.png`],
  },
  other: {
    "fc:miniapp": fcMiniappEmbed,
    "base:app_id": "698328eabd202a51855da5a1",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="icon" href="/assets/icon.png" />
        <link rel="apple-touch-icon" href="/assets/icon.png" />
      </head>
      <body>
        <main className="app-container">{children}</main>
      </body>
    </html>
  );
}
