import { Geist, Pacifico } from "next/font/google";

import "./globals.css";
import type { Metadata } from "next";
import { NavProvider } from "@/app/lib/context/nav";
import HamburgerMenu from "@/app/components/hamsbuger_menu";
import { AuthProvider } from "@/app/lib/context/AuthContext";
import { Toaster } from "sonner";
import AuthSSRInit from "@/app/components/auth/AuthSSRInit";
import SmoothLoadingWrapper from "@/app/components/loading_screen/SmoothLoadingWrapper";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdProvider from "@/app/components/antd/AntdProvider";
import { Suspense } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ConfigProvider, theme } from "antd";
import { SocketProvider } from "@/app/lib/context/SocketContext";
import { QueryProvider } from "@/app/providers/QueryProvider";

export const metadata: Metadata = {
  title: "Cinefluent - Learn English Through Movies",
  description:
    "Master English with interactive movie-based learning. Watch films, play multiplayer games, and improve your language skills naturally.",
  keywords:
    "english learning, movies, films, language learning, multiplayer games, flashcards, subtitles, shadowing, AI learning",
};
// 1. Cấu hình Geist (Font chính)
const geistSans = Geist({
  variable: "--font-geist-sans", // Tên biến phải khớp với bên CSS
  subsets: ["latin"],
});

// 2. Cấu hình Pacifico (Font Logo)
const pacifico = Pacifico({
  variable: "--font-pacifico", // Tên biến phải khớp với bên CSS
  weight: "400",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <html lang="vi" suppressHydrationWarning={true}>
        <body
          className={`${geistSans.variable} ${pacifico.variable} antialiased bg-[#0f172a] text-white`}
        >
          <ConfigProvider
            theme={{
              algorithm: theme.darkAlgorithm,
            }}
          >
            <GoogleOAuthProvider
              clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
            >
              <QueryProvider>
                <SmoothLoadingWrapper />
                <AuthProvider>
                  {/* <SocketProvider> */}
                  <NavProvider>
                    <Suspense>
                      <AuthSSRInit />
                    </Suspense>
                    <AntdProvider>{children}</AntdProvider>
                    <HamburgerMenu />
                    <Toaster position="top-right" closeButton />
                  </NavProvider>
                  {/* </SocketProvider> */}
                </AuthProvider>
              </QueryProvider>
            </GoogleOAuthProvider>
          </ConfigProvider>
        </body>
      </html>
    </>
  );
}
