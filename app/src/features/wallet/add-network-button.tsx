import { ConnectButton as RainbowKitConnect } from "@rainbow-me/rainbowkit";
import { css } from "styled-system/css";
import { center } from "styled-system/patterns";
import { useSwitchChain } from "wagmi";

import IconCheck from "~/shared/assets/icon-check.svg?react";
import { maroo } from "~/shared/lib/chain";
import { Button } from "~/shared/ui/button";

interface Props {
  disabled?: boolean;
  onAdded?: () => void;
}

export const AddNetworkButton = ({ disabled }: Props) => {
  const { switchChain } = useSwitchChain();

  return (
    <RainbowKitConnect.Custom>
      {({ account, chain, authenticationStatus, mounted }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return null;
              }

              if (chain.unsupported) {
                return (
                  <div>
                    <p
                      className={css({
                        mt: "10px",
                        mb: "10px",
                        textStyle: "caption.regular",
                        color: "gray.500",
                      })}
                    >
                      To request tokens, add Maroo Network to your wallet first.
                    </p>
                    <Button
                      onClick={() => switchChain({ chainId: maroo.id })}
                      type="button"
                      disabled={disabled}
                    >
                      Add Network to wallet
                    </Button>
                  </div>
                );
              }

              return (
                <div
                  className={center({
                    textStyle: "caption.medium",
                    color: "primary",
                    gap: "4px",
                    w: "fit-content",
                    mt: "10px",
                  })}
                >
                  <IconCheck />
                  Added Maroo to your wallet!
                </div>
              );
            })()}
          </div>
        );
      }}
    </RainbowKitConnect.Custom>
  );
};
