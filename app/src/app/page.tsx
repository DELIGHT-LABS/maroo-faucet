"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { AddNetworkButton } from "@/components/add-network-button";

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

export default function Home() {
  const { address, isConnected } = useAccount();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [selectedChain, setSelectedChain] = useState("C");
  const [loading, setLoading] = useState(false);
  const [chains, setChains] = useState<ChainConfig[]>([]);
  const [currentChainConfig, setCurrentChainConfig] =
    useState<ChainConfig | null>(null);

  // Load chain configurations
  useEffect(() => {
    const loadChains = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/getChainConfigs`,
        );
        const data = await response.json();
        setChains(data.configs || []);
      } catch (error) {
        console.error("Failed to load chain configs:", error);
      }
    };
    loadChains();
  }, []);

  // Update current chain config when selection changes
  useEffect(() => {
    const config = chains.find((c) => c.ID === selectedChain);
    setCurrentChainConfig(config || null);
  }, [selectedChain, chains]);

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
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/sendToken`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: targetAddress,
            chain: selectedChain,
            token,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Successfully sent ${currentChainConfig?.DRIP_AMOUNT || 2} ${currentChainConfig?.TOKEN || "tokens"} to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`,
        );
        setRecipientAddress("");

        // Show transaction link if available
        if (data.txHash && currentChainConfig?.EXPLORER) {
          toast.info("View Transaction", {
            action: {
              label: "Open Explorer",
              onClick: () =>
                window.open(
                  `${currentChainConfig.EXPLORER}/tx/${data.txHash}`,
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
      <div className="absolute top-4 right-4">
        <ConnectButton />
      </div>

      <div className="mx-auto max-w-2xl pt-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Lux Testnet Faucet
          </h1>
          <p className="text-lg text-muted-foreground">
            Get test tokens for Lux networks and subnets
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-2xl">
          <form onSubmit={handleRequest} className="space-y-6">
            {/* Chain Selection */}
            <div>
              <label htmlFor="chain" className="block text-sm font-medium mb-2">
                Select Network
              </label>
              <select
                id="chain"
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {chains.length > 0 ? (
                  chains.map((chain) => (
                    <option key={chain.ID} value={chain.ID}>
                      {chain.NAME} ({chain.TOKEN})
                    </option>
                  ))
                ) : (
                  <option value="C">Loading...</option>
                )}
              </select>
            </div>

            {/* Address Input */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium mb-2"
              >
                Recipient Address{" "}
                {isConnected && "(Optional - uses connected wallet)"}
              </label>
              <input
                id="address"
                type="text"
                placeholder={isConnected ? address : "0x..."}
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {isConnected && !recipientAddress && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Tokens will be sent to your connected wallet:{" "}
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              )}
            </div>

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
                • Rate limited to {currentChainConfig?.RATELIMIT.MAX_LIMIT || 1}{" "}
                request
                {(currentChainConfig?.RATELIMIT.MAX_LIMIT || 1) > 1 && "s"} per
                address every{" "}
                {currentChainConfig?.RATELIMIT.WINDOW_SIZE || 1440} minutes
              </li>
              <li>
                • Drip amount: {currentChainConfig?.DRIP_AMOUNT || 2}{" "}
                {currentChainConfig?.TOKEN || "tokens"} per request
              </li>
              <li>• Test tokens have no real value</li>
              <li>• For development and testing purposes only</li>
            </ul>
          </div>

          {/* Add Network Button */}
          {currentChainConfig && (
            <AddNetworkButton
              config={{
                CHAINID: currentChainConfig.CHAINID,
                NAME: currentChainConfig.NAME,
                TOKEN: currentChainConfig.TOKEN,
                RPC: currentChainConfig.RPC,
                EXPLORER: currentChainConfig.EXPLORER,
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
