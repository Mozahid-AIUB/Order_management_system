import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Order Management System",
  description: "Order management with promotions",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* overflow-x-hidden keeps a wide table from pushing the whole page sideways. */}
      <body className="flex min-h-full overflow-x-hidden">
        <Sidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </body>
    </html>
  );
}
