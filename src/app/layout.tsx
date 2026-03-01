import type { Metadata } from "next";
import { Toaster } from "@/components/toaster";
import { AuthProvider } from "@/lib/auth-context";
import NavBar from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "灵芝水铺 - 图文优化系统",
  description: "小红书封面生成与素材管理",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          <NavBar />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
