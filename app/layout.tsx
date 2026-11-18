import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PaisaTrack",
  description: "A private personal expense and income tracker",
};

export const instant = false;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="app-gradient min-h-full font-sans text-slate-900">
        <ToastProvider><main className="min-h-screen">{children}</main></ToastProvider>
      </body>
    </html>
  );
}
