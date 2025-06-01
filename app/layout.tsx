import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'
import "./globals.css";
import AnalyticsProvider from "./providers/analytics-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff'
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://quridor.com'),
  title: {
    default: "圍牆圍棋 QUORIDOR | 策略棋盤遊戲",
    template: "%s | 圍牆圍棋 QUORIDOR"
  },
  description: "圍牆圍棋 QUORIDOR 是一款策略棋盤遊戲，玩家需要在棋盤上建立牆壁，阻礙對手的棋子移動，最終佔領的地盤最多者勝利，快來體驗這款結合圍棋與迷宮元素的精彩遊戲！",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  keywords: ["圍牆圍棋", "QUORIDOR", "棋盤遊戲", "策略遊戲", "圍棋", "迷宮遊戲", "益智遊戲"],
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
    title: "圍牆圍棋 QUORIDOR | 策略棋盤遊戲",
    description: "圍牆圍棋 QUORIDOR 是一款策略棋盤遊戲，玩家需要在棋盤上建立牆壁，阻礙對手的棋子移動，最終佔領的地盤最多者勝利，快來體驗這款結合圍棋與迷宮元素的精彩遊戲！",
    siteName: "圍牆圍棋 QUORIDOR",
    images: [
      {
        url: `/og-image.png`,
        width: 1200,
        height: 630,
        alt: "圍牆圍棋 QUORIDOR 遊戲畫面",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "圍牆圍棋 QUORIDOR | 策略棋盤遊戲",
    description: "圍牆圍棋 QUORIDOR 是一款策略棋盤遊戲，玩家需要在棋盤上建立牆壁，阻礙對手的棋子移動，最終佔領的地盤最多者勝利，快來體驗這款結合圍棋與迷宮元素的精彩遊戲！",
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
        className={`${geistSans.variable} ${geistMono.variable} select-none antialiased`}
      >
        <Suspense fallback={null}>
          <AnalyticsProvider>
            {children}
          </AnalyticsProvider>
        </Suspense>
      </body>
      <GoogleAnalytics gaId="G-79SW4LKDFE" />
    </html>
  );
}
