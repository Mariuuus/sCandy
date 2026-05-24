import type { Metadata } from "next";
import { DM_Mono, Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "./page";
import PrinterCard from "@/components/custom/printer-card";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const dmMono = DM_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["300", "400", "500"] });

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "sCandy",
  description: "a hp scanner manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", geistSans.variable, geistMono.variable, dmMono.variable, fraunces.variable)}
    >
      <body
        className="min-h-full flex flex-col align-middle content-start justify-items-center px-4">
          <TooltipProvider>
            <Navbar></Navbar>
            <div className="max-w-4xl w-full self-center  md:grid md:grid-cols-2 grid-cols-1 gap-4">
              <PrinterCard className="col-span-2"></PrinterCard>
              {children}
            </div>
            <Toaster />
          </TooltipProvider>
      </body>
    </html>
  );
}
