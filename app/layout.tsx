// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "用户名查询工具",
  description: "在全网查询你的用户名",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        <main className="bg-gray-900 text-white min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
