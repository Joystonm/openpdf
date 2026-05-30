import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Fileify ",
  description:
    "Free PDF and image tools. Compress, merge, split, convert, resize, remove backgrounds and more. No signup, no ads, no limits. Files processed locally in your browser.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans bg-cream-100 text-warm-900 antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
