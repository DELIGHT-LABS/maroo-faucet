"use client";

import {
  lightTheme,
  RainbowKitAuthenticationProvider,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider, useAtomValue } from "jotai";
import { useState } from "react";
import { WagmiProvider } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";

import { authStateAtom, authStore } from "~/features/siwe/auth-store";
import { siweAuthAdapter } from "~/features/siwe/siwe-auth-adapter";
import { config } from "~/shared/lib/wagmi";

function RainbowKitWithAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAtomValue(authStateAtom);

  return (
    <RainbowKitAuthenticationProvider adapter={siweAuthAdapter} status={status}>
      <RainbowKitProvider theme={lightTheme()}>{children}</RainbowKitProvider>
    </RainbowKitAuthenticationProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <JotaiProvider store={authStore}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitWithAuth>{children}</RainbowKitWithAuth>
        </QueryClientProvider>
      </WagmiProvider>
    </JotaiProvider>
  );
}
