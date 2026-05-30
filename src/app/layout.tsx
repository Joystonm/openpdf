import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Fileify ",
  description:
    "Free PDF and image tools. Compress, merge, split, convert, resize, remove backgrounds and more. No signup, no ads, no limits. Files processed locally in your browser.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, playfair.variable, "font-sans bg-cream-100 text-warm-900 antialiased")}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
