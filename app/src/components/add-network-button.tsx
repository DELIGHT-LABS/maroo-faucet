"use client";

import { toast } from "sonner";
import {
  addNetwork,
  addToken,
  type NetworkConfig,
  type TokenConfig,
} from "@/lib/metamask";

interface AddNetworkButtonProps {
  config: NetworkConfig;
  token?: TokenConfig;
}

export function AddNetworkButton({ config, token }: AddNetworkButtonProps) {
  const handleAddNetwork = async () => {
    try {
      await addNetwork(config);
      toast.success(`${config.NAME} added to MetaMask`);
    } catch (_error) {
      toast.error("Failed to add network");
    }
  };

  const handleAddToken = async () => {
    if (!token) return;

    try {
      await addToken(token);
      toast.success(`${token.TOKEN} added to MetaMask`);
    } catch (_error) {
      toast.error("Failed to add token");
    }
  };

  const handleOpenExplorer = () => {
    if (!config.EXPLORER) return;

    const url = token?.CONTRACTADDRESS
      ? `${config.EXPLORER}/address/${token.CONTRACTADDRESS}`
      : config.EXPLORER;

    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <button
        onClick={handleAddNetwork}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
      >
        <img
          src="/metamask.webp"
          alt="MetaMask"
          className="h-5 w-5"
          onError={(e) => {
            e.currentTarget.src =
              "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg";
          }}
        />
        Add Network to MetaMask
      </button>

      {config.EXPLORER && (
        <button
          onClick={handleOpenExplorer}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          View Block Explorer
        </button>
      )}

      {token?.CONTRACTADDRESS && (
        <button
          onClick={handleAddToken}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          {token.IMAGE ? (
            <img
              src={token.IMAGE}
              alt={token.TOKEN}
              className="h-5 w-5 rounded-full"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-muted" />
          )}
          Add {token.TOKEN} to MetaMask
        </button>
      )}
    </div>
  );
}
