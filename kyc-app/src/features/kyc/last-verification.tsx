"use client";

import { css } from "@maroo/styled-system/css";
import { center, flex } from "@maroo/styled-system/patterns";
import { Button, ErrorCard } from "@maroo/ui";
import IconCheck from "@maroo/ui/assets/icon-check.svg?react";
import IconRefresh from "@maroo/ui/assets/icon-refresh.svg?react";
import IconSpinner from "@maroo/ui/assets/icon-spinner.svg?react";

import { Resend } from "./resend";
import { useCompleteVerify } from "./use-complete-verify";
import type { ResendStep } from "./use-request-verify";

const CheckYourKakao = () => (
  <div className={flex({ flexDir: "column" })}>
    <h3 className={css({ textStyle: "body1.medium", color: "gray.700" })}>
      Check your kakaotalk
    </h3>
    <p
      className={css({
        textStyle: "caption.regular",
        color: "gray.500",
        mt: "6px",
      })}
    >
      We sent a verification request to your phone.
      <br />
      Please approve it to proceed.
    </p>
  </div>
);

export const LastVerification = ({
  onRetry,
  onResend,
  resendStep,
}: {
  onRetry: () => void;
  onResend: () => void;
  resendStep: ResendStep;
}) => {
  const { isPending, mutate: complete, isSuccess, error } = useCompleteVerify();

  const isInitial = !isPending && !isSuccess && !error;

  return (
    <div className={flex({ flexDir: "column", gap: "16px" })}>
      {isInitial && <CheckYourKakao />}

      {!error && (
        <div>
          <Button
            disabled={isPending || isSuccess || resendStep === "sending"}
            onClick={() => complete()}
            className={center({ gap: "8px" })}
          >
            {isPending && (
              <>
                Verifying Identity...
                <IconSpinner className={css({ animation: "spin" })} />
              </>
            )}

            {isSuccess && (
              <>
                Verified!
                <IconCheck />
              </>
            )}

            {isInitial && "Complete Verification"}
          </Button>

          {(isPending || isSuccess) && (
            <p
              className={css({
                textStyle: "caption.regular",
                color: "gray.500",
                mt: "8px",
              })}
            >
              {isPending && "Recording on-chain, please wait..."}
              {isSuccess && "You can now close this tab safely."}
            </p>
          )}
        </div>
      )}

      {error && (
        <>
          <div className={css({ w: 0, minW: "full" })}>
            <ErrorCard message={error.message} />
          </div>

          <Button
            color="transparent"
            onClick={onRetry}
            className={center({ gap: "8px" })}
          >
            <IconRefresh />
            Retry
          </Button>
        </>
      )}

      {isInitial && <Resend onResend={onResend} step={resendStep} />}
    </div>
  );
};
