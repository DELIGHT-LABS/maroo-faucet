"use client";

import { lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { WagmiProvider } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";

import { RECAPTCHA_SITE_KEY } from "~/shared/lib/env";
import { config } from "~/shared/lib/wagmi";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={lightTheme()}>
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </GoogleReCaptchaProvider>
  );
}
