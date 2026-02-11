import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import type { KycFormValues } from "./schema";
import { useStepper } from "./use-stepper";

const SENDING_MIN_MS = 500;
const SENT_DISPLAY_MS = 2_000;
const COOLDOWN_MS = 30_000;

export type ResendStep = "idle" | "sending" | "sent" | "cooldown";

export function useRequestVerify() {
  const [formData, setFormData] = useState<KycFormValues | null>(null);
  const [resendStep, setResendStep] = useState<ResendStep>("idle");
  const { run, stop } = useStepper();

  const { mutate, error } = useMutation({
    mutationFn: async (data: KycFormValues) => {
      console.log("KYC verification:", data);
      await Promise.all([
        new Promise((resolve) => setTimeout(resolve, 2000)), // TODO: replace with actual API call
        new Promise((resolve) => setTimeout(resolve, SENDING_MIN_MS)),
      ]);
    },
  });

  const send = (data: KycFormValues) => {
    if (formData) {
      return;
    }
    setFormData(data);
    setResendStep("cooldown");
    mutate(data, {
      onSettled: () => run([{ step: "idle", ms: COOLDOWN_MS }], setResendStep),
    });
  };

  const resend = () => {
    if (!formData || resendStep !== "idle") {
      return;
    }
    setResendStep("sending");
    mutate(formData, {
      onSuccess: () =>
        run(
          [
            { step: "sent" },
            { step: "cooldown", ms: SENT_DISPLAY_MS },
            { step: "idle", ms: COOLDOWN_MS },
          ],
          setResendStep,
        ),
      onError: () => setResendStep("idle"),
    });
  };

  const reset = () => {
    stop();
    setFormData(null);
    setResendStep("idle");
  };

  return { resendStep, send, resend, reset, error };
}
