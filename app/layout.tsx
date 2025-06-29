import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import AnalyticsProvider from "./providers/analytics-provider";
import { GameProvider } from "./contexts/GameContext";
import { RuleModalProvider } from "./contexts/RuleModalContext";
import RuleModal from "./components/RuleModal";
import { RoomListModalProvider } from "./contexts/RoomListModalContext";
import RoomListModal from "./components/RoomListModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://quoridorgame.com"),
  title: {
    default: "牆壁圍棋 Wall Go | QUORIDOR 類型的創意線上遊戲",
    template: "%s | 牆壁圍棋 Wall Go",
  },
  description:
    "體驗如同 Netflix 熱門影集「魔鬼的計謀 2」中的牆壁圍棋 Wall Go。在遊戲中運用策略與心理戰，佈局如同魔鬼的計謀，贏得勝利！",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  keywords: [
    "牆壁圍棋",
    "Wall Go",
    "QUORIDOR",
    "魔鬼的計謀 2",
    "Netflix",
    "心理戰",
    "智力對決",
    "棋盤遊戲",
    "策略遊戲",
    "圍棋",
    "迷宮遊戲",
    "益智遊戲",
  ],
  authors: [{ name: "Zach Chiu" }],
  creator: "Zach Chiu",
  publisher: "Zach Chiu",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: process.env.SITE_URL,
    title: "牆壁圍棋 Wall Go - 如同「魔鬼的計謀 2」的智力對決",
    description:
      "體驗如同 Netflix 熱門影集「魔鬼的計謀 2」中的牆壁圍棋 Wall Go。在遊戲中運用策略與心理戰，佈局如同魔鬼的計謀，贏得勝利！",
    siteName: "牆壁圍棋 Wall Go",
    images: [
      {
        url: `/og-image.png`,
        width: 1200,
        height: 630,
        alt: "牆壁圍棋 Wall Go 遊戲畫面",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "牆壁圍棋 Wall Go - 如同「魔鬼的計謀 2」的智力對決",
    description:
      "體驗如同 Netflix 熱門影集「魔鬼的計謀 2」中的牆壁圍棋 Wall Go。在遊戲中運用策略與心理戰，佈局如同魔鬼的計謀，贏得勝利！",
    images: [`/og-image.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} select-none bg-gradient-to-br from-gray-200 via-white to-gray-300 antialiased`}
      >
        <RuleModalProvider>
          <GameProvider>
            <Suspense fallback={null}>
              <AnalyticsProvider>
                {children}
                <RuleModal />
              </AnalyticsProvider>
            </Suspense>
          </GameProvider>
        </RuleModalProvider>
      </body>
      {process.env.NEXT_PUBLIC_APP_ENV === "production" && (
        <GoogleAnalytics gaId="G-1CTRTGRPFF" />
      )}
    </html>
  );
}
