import { css } from "@maroo/styled-system/css";
import { center, flex } from "@maroo/styled-system/patterns";
import { Button } from "@maroo/ui";
import IconMetaMask from "@maroo/ui/assets/icon-metamask.svg?react";
import IconWallet from "@maroo/ui/assets/icon-wallet.svg?react";
import IconWalletConnect from "@maroo/ui/assets/icon-walletconnect.svg?react";
import { ConnectButton as RainbowKitConnect } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect } from "wagmi";

interface Props {
  label?: string;
  disabled?: boolean;
}

export const ConnectButton = ({
  label = "Connect Wallet",
  disabled,
}: Props) => {
  const { connector } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <RainbowKitConnect.Custom>
      {({
        account,
        chain,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          connector &&
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
                return (
                  <Button
                    onClick={openConnectModal}
                    type="button"
                    disabled={disabled}
                  >
                    {label}
                  </Button>
                );
              }

              return (
                <div
                  className={flex({
                    align: "center",
                    justify: "space-between",
                    border: "1px solid",
                    borderColor: "gray.300",
                    rounded: "8px",
                    p: "10px 10px 10px 16px",
                  })}
                >
                  <div className={center({ gap: "16px" })}>
                    {connector.icon && (
                      <img
                        alt={connector.name}
                        src={connector.icon}
                        className={center({ w: "24px", h: "24px" })}
                      />
                    )}
                    {!connector.icon && connector.name === "MetaMask" && (
                      <IconMetaMask
                        className={center({ w: "24px", h: "24px" })}
                      />
                    )}
                    {!connector.icon && connector.name === "WalletConnect" && (
                      <IconWalletConnect
                        className={center({ w: "24px", h: "24px" })}
                      />
                    )}
                    {!connector.icon &&
                      connector.name !== "MetaMask" &&
                      connector.name !== "WalletConnect" && (
                        <IconWallet
                          className={center({ w: "24px", h: "24px" })}
                        />
                      )}

                    <span
                      className={css({
                        textStyle: "body2.regular",
                        color: "gray.900",
                      })}
                    >
                      {account.address.slice(0, 6)}...
                      {account.address.slice(-6)}
                    </span>
                  </div>

                  <Button
                    onClick={() => disconnect()}
                    type="button"
                    color="ghost"
                    size="fit"
                    disabled={disabled}
                  >
                    Disconnect
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </RainbowKitConnect.Custom>
  );
};
