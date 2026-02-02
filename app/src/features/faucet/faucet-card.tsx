"use client";

import { useEffect } from "react";
import { css } from "styled-system/css";
import { center, divider, flex } from "styled-system/patterns";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";

import { AddNetworkButton } from "~/features/wallet/add-network-button";
import { ConnectButton } from "~/features/wallet/connect-button";

import IconCheck from "~/shared/assets/icon-check.svg?react";
import IconRefresh from "~/shared/assets/icon-refresh.svg?react";
import IconSpinner from "~/shared/assets/icon-spinner.svg?react";
import { marooTestnet } from "~/shared/lib/chain";
import { Button } from "~/shared/ui/button";
import { ErrorCard } from "~/shared/ui/error-card";
import { Idx } from "~/shared/ui/idx";

import { isRateLimitError } from "./error";
import { useRequestToken } from "./use-request-token";
import { useTimer } from "./use-timer";

export function FaucetCard() {
  const { address } = useAccount();
  const {
    mutate: requestToken,
    data,
    error,
    isPending,
    reset,
  } = useRequestToken();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: data?.txHash });

  const isLoading = isPending || isConfirming;

  const isRateLimited = isRateLimitError(error);

  const { chainId, isDisconnected } = useAccount();
  const step = chainId === marooTestnet.id ? 2 : 1;

  useEffect(() => {
    if (isDisconnected) {
      reset();
    }
  }, [isDisconnected, reset]);

  const { m, s, isTicking } = useTimer(isRateLimited ? error.retryAfter : 0);

  return (
    <div
      className={css({
        border: "1px solid",
        borderColor: "primary",
        bg: "white",
        rounded: "16px",
        w: { base: "full", md: "500px" },
        mb: "16px",
        p: { base: "24px", md: "32px" },
      })}
    >
      <div className={flex({ flexDir: "column" })}>
        <div
          className={flex({ gap: "16px", mb: "16px", alignItems: "center" })}
        >
          <Idx i={1} />
          <p className={css({ textStyle: "body1.bold", color: "gray.900" })}>
            Connect your wallet
          </p>
        </div>
        <ConnectButton />

        <AddNetworkButton />
      </div>

      <div
        className={divider({
          mt: { base: "20px", md: "32px" },
          mb: { base: "20px", md: "32px" },
          color: "gray.200",
        })}
      />

      <div className={flex({ flexDir: "column", gap: "16px" })}>
        <div className={flex({ gap: "16px", alignItems: "center" })}>
          <Idx i={2} color={step === 2 ? "primary" : "ghost"} />
          <p
            className={css({
              textStyle: "body1.bold",
              color: step === 2 ? "gray.900" : "gray.400",
            })}
          >
            Request test tokens to your wallet
          </p>
        </div>

        {step === 2 && !error && address && (
          <Button
            onClick={() => requestToken({ address })}
            type="button"
            disabled={isLoading || isConfirmed}
            className={center({ gap: "8px" })}
          >
            {isLoading && (
              <>
                Requesting...
                <IconSpinner className={css({ animation: "spin" })} />
              </>
            )}
            {isConfirmed && (
              <>
                Tokens Sent!
                <IconCheck />
              </>
            )}
            {!isLoading && !isConfirmed && "Request Tokens"}
          </Button>
        )}
        {step === 2 && isConfirmed && address && (
          <Button
            onClick={reset}
            color="transparent"
            type="button"
            className={center({ gap: "8px" })}
          >
            <IconRefresh />
            Request More
          </Button>
        )}
        {step === 2 && error && (
          <div>
            <ErrorCard message={error.message} />
            {isTicking ? (
              <div
                className={center({
                  h: "40px",
                  mt: "16px",
                  color: "gray.500",
                  bg: "gray.100",
                  opacity: 0.5,
                  rounded: "8px",
                  textStyle: "button.m",
                })}
              >
                Try again in {m}:{s}
              </div>
            ) : (
              <Button
                color="transparent"
                onClick={reset}
                className={center({ gap: "8px", mt: "16px" })}
              >
                <IconRefresh />
                Retry
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
