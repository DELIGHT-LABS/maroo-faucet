"use client";

import { useMutation } from "@tanstack/react-query";
import { css } from "styled-system/css";
import { center, flex } from "styled-system/patterns";

import IconCheck from "~/shared/assets/icon-check.svg?react";
import IconSpinner from "~/shared/assets/icon-spinner.svg?react";
import { Button } from "~/shared/ui/button";

const useMockApi = () =>
  useMutation({
    mutationFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    },
  });

export const LastVerification = () => {
  const { isPending, mutate: verify, isSuccess } = useMockApi();

  return (
    <div className={flex({ flexDir: "column", gap: "16px" })}>
      {!isPending && !isSuccess && (
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
      )}

      <div>
        <Button
          disabled={isPending || isSuccess}
          onClick={() => verify()}
          className={center({ gap: "8px" })}
        >
          {isPending && (
            <>
              Verifying...{" "}
              <IconSpinner className={css({ animation: "spin" })} />
            </>
          )}

          {isSuccess && (
            <>
              Verified!
              <IconCheck />
            </>
          )}

          {!isPending && !isSuccess && "Complete Verification"}
        </Button>

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
      </div>

      {!isPending && !isSuccess && (
        <div
          className={center({
            textStyle: "body2.regular",
            color: "gray.500",
            p: "10px 20px",
          })}
        >
          Didnt' receive it?
          <button
            className={css({
              textStyle: "button.m",
              ml: "4px",
              cursor: "pointer",
            })}
          >
            Resend
          </button>
        </div>
      )}
    </div>
  );
};
