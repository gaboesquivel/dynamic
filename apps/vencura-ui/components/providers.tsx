"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || "",
      }}
    >
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        enableColorScheme
      >
        {children}
      </NextThemesProvider>
    </DynamicContextProvider>
  );
}
