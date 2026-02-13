"use client";

import {
  lightTheme,
  RainbowKitAuthenticationProvider,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { WagmiProvider } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";

import {
  authActions,
  authStateAtom,
  authStore,
} from "~/features/siwe/auth-store";
import { siweAuthAdapter } from "~/features/siwe/siwe-auth-adapter";
import { useSession } from "~/features/siwe/use-session";
import { config } from "~/shared/lib/wagmi";

function RainbowKitWithAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAtomValue(authStateAtom);
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      authActions.login(session.verified);
    }
  }, [session]);

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
