import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "离职人员动态跟踪系统",
  description: "HR离职员工回访跟踪与数据分析平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col`} suppressHydrationWarning>{children}</body>
    </html>
  );
}
