"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem storageKey="unravel:theme">
      {children}
    </NextThemesProvider>
  );
}
