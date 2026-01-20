"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { AddNetworkButton } from "~/components/add-network-button";

interface ChainConfig {
  ID: string;
  NAME: string;
  TOKEN: string;
  RPC: string;
  CHAINID: number;
  EXPLORER: string;
  DRIP_AMOUNT: number;
  RATELIMIT: {
    MAX_LIMIT: number;
    WINDOW_SIZE: number;
  };
}

const MAROO_ID = import.meta.env.WAKU_PUBLIC_MAROO_ID || "MAROO_TESTNET";

export function Home() {
  const { address, isConnected } = useAccount();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [marooConfig, setMarooConfig] = useState<ChainConfig | null>(null);

  // Load chain configurations
  useEffect(() => {
    const loadChains = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.WAKU_PUBLIC_API_URL || "http://localhost:8000"}/api/getChainConfigs`,
        );
        const data = await response.json();
        setMarooConfig(
          data.configs.find((c: ChainConfig) => c.ID === MAROO_ID) || null,
        );
      } catch (error) {
        console.error("Failed to load chain configs:", error);
      }
    };
    loadChains();
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetAddress = recipientAddress || address;
    if (!targetAddress) {
      toast.error("Please connect wallet or enter an address");
      return;
    }

    if (!executeRecaptcha) {
      toast.error("ReCaptcha not loaded");
      return;
    }

    setLoading(true);
    try {
      // Get ReCaptcha token
      const token = await executeRecaptcha("faucet_request");

      const response = await fetch(
        `${import.meta.env.WAKU_PUBLIC_API_URL || "http://localhost:8000"}/api/sendToken`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: targetAddress,
            chain: MAROO_ID,
            token,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Successfully sent ${marooConfig?.DRIP_AMOUNT || 2} ${marooConfig?.TOKEN || "tokens"} to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`,
        );
        setRecipientAddress("");

        // Show transaction link if available
        if (data.txHash && marooConfig?.EXPLORER) {
          toast.info("View Transaction", {
            action: {
              label: "Open Explorer",
              onClick: () =>
                window.open(
                  `${marooConfig.EXPLORER}/tx/${data.txHash}`,
                  "_blank",
                ),
            },
          });
        }
      } else {
        toast.error(data.message || "Failed to send tokens");
      }
    } catch (error) {
      console.error("Request error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 md:p-8">
      <div className="mx-auto max-w-2xl pt-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Maroo Testnet Faucet
          </h1>
          <p className="text-lg text-muted-foreground">
            Get test tokens for Maroo networks and subnets
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-2xl">
          <form onSubmit={handleRequest} className="space-y-6">
            <ConnectButton />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (!isConnected && !recipientAddress)}
              className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Request Tokens"}
            </button>
          </form>

          {/* Info */}
          <div className="mt-8 space-y-3 rounded-lg bg-muted/50 p-4 text-sm">
            <h3 className="font-semibold">Important Notes:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                • Rate limited to {marooConfig?.RATELIMIT.MAX_LIMIT || 1}{" "}
                request
                {(marooConfig?.RATELIMIT.MAX_LIMIT || 1) > 1 && "s"} per address
                every {marooConfig?.RATELIMIT.WINDOW_SIZE || 1440} minutes
              </li>
              <li>
                • Drip amount: {marooConfig?.DRIP_AMOUNT || 2}{" "}
                {marooConfig?.TOKEN || "tokens"} per request
              </li>
              <li>• Test tokens have no real value</li>
              <li>• For development and testing purposes only</li>
            </ul>
          </div>

          {/* Add Network Button */}
          {marooConfig && (
            <AddNetworkButton
              config={{
                CHAINID: marooConfig.CHAINID,
                NAME: marooConfig.NAME,
                TOKEN: marooConfig.TOKEN,
                RPC: marooConfig.RPC,
                EXPLORER: marooConfig.EXPLORER,
              }}
            />
          )}
        </div>

        {/* Tech Stack */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Built with Next.js 16 • React 19 • Tailwind CSS 4 • viem 2 • wagmi 2
          </p>
        </div>
      </div>
    </main>
  );
}
