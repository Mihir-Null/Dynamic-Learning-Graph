"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { PropsWithChildren, useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import theme from "@/lib/theme";

const createEmotionCache = () =>
  createCache({
    key: "mui",
    prepend: true
  });

export default function ThemeRegistry({ children }: PropsWithChildren) {
  const [cache] = useState(createEmotionCache);

  useServerInsertedHTML(() => (
    <style
      data-emotion={`${cache.key} ${Object.keys(cache.inserted).join(" ")}`}
      dangerouslySetInnerHTML={{
        __html: Object.values(cache.inserted).join(" ")
      }}
    />
  ));

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
