import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { PipelineProvider } from "./pipeline-provider";

const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
  adjustFontFallback: false,
});

const interExtended = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter-extended",
  adjustFontFallback: false,
  preload: false,
});

const jetBrainsMono = localFont({
  src: "../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
  variable: "--font-jetbrains-mono",
  adjustFontFallback: false,
});

const jetBrainsMonoExtended = localFont({
  src: "../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-ext-wght-normal.woff2",
  weight: "100 800",
  variable: "--font-jetbrains-mono-extended",
  adjustFontFallback: false,
  preload: false,
});

export const metadata: Metadata = {
  title: "Unravel",
  description: "Transform data locally in your browser.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${interExtended.variable} ${jetBrainsMono.variable} ${jetBrainsMonoExtended.variable} dark`}>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <TooltipProvider>
            <PipelineProvider>{children}</PipelineProvider>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
