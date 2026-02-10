import { css } from "@maroo/styled-system/css";
import { center } from "@maroo/styled-system/patterns";
import IconSpinner from "@maroo/ui/assets/icon-spinner.svg?react";

import type { ResendStep } from "./use-request-verify";

export const Resend = ({
  onResend,
  step,
}: {
  onResend: () => void;
  step: ResendStep;
}) => (
  <div
    aria-disabled={step === "cooldown"}
    className={center({
      textStyle: "body2.regular",
      color: "gray.500",
      p: "10px 20px",
      gap: "4px",
      _disabled: { color: "gray.300" },
    })}
  >
    {(step === "idle" || step === "cooldown") && (
      <>
        Didn't receive it?
        <button
          onClick={onResend}
          disabled={step === "cooldown"}
          className={css({
            textStyle: "button.m",
            ml: "4px",
            cursor: "pointer",
            _disabled: { cursor: "not-allowed" },
          })}
        >
          Resend
        </button>
      </>
    )}

    {step === "sent" && <>Sent!</>}

    {step === "sending" && (
      <>
        Sending...
        <IconSpinner
          className={css({
            animation: "spin",
            ml: "4px",
            "& > *": { fill: "gray.500" },
          })}
        />
      </>
    )}
  </div>
);
