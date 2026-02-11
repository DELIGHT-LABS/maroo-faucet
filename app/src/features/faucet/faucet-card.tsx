"use client";

import { css } from "@maroo/styled-system/css";
import { center } from "@maroo/styled-system/patterns";
import { Button, ErrorCard, StepCard, StepCards } from "@maroo/ui";
import IconCheck from "@maroo/ui/assets/icon-check.svg?react";
import IconRefresh from "@maroo/ui/assets/icon-refresh.svg?react";
import IconSpinner from "@maroo/ui/assets/icon-spinner.svg?react";
import { useEffect } from "react";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { AddNetworkButton } from "~/features/wallet/add-network-button";
import { ConnectButton } from "~/features/wallet/connect-button";
import { marooTestnet } from "~/shared/lib/chain";

import { isRateLimitError } from "./error";
import { useRequestToken } from "./use-request-token";
import { useTimer } from "./use-timer";

const ConnectStep = () => (
  <StepCard active idx={1} title="Connect your wallet">
    <ConnectButton />

    <AddNetworkButton />
  </StepCard>
);

const RequestStep = () => {
  const { address, chainId, isDisconnected } = useAccount();
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

  const step = chainId === marooTestnet.id ? 2 : 1;

  useEffect(() => {
    if (isDisconnected) {
      reset();
    }
  }, [isDisconnected, reset]);

  const { m, s, isTicking } = useTimer(isRateLimited ? error.retryAfter : 0);

  return (
    <StepCard
      idx={2}
      title="Request test tokens to your wallet"
      active={step === 2}
    >
      {!error && address && (
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
      {isConfirmed && address && (
        <Button
          onClick={reset}
          color="transparent"
          type="button"
          className={center({ gap: "8px", mt: "16px" })}
        >
          <IconRefresh />
          Request More
        </Button>
      )}
      {error && (
        <div className={css({ w: 0, minW: "full" })}>
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
    </StepCard>
  );
};

export function FaucetCard() {
  return <StepCards StepOne={<ConnectStep />} StepTwo={<RequestStep />} />;
}
