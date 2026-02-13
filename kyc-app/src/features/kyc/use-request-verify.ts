import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { kycApi } from "~/shared/api/kyc-api";
import { RequestError } from "./error";
import type { KycFormValues } from "./schema";
import { useStepper } from "./use-stepper";

const SENDING_MIN_MS = 500;
const SENT_DISPLAY_MS = 2_000;
const COOLDOWN_MS = 30_000;

export type ResendStep = "idle" | "sending" | "sent" | "cooldown";

export function useRequestVerify({
  onSuccessRequest,
}: {
  onSuccessRequest: () => void;
}) {
  const [formData, setFormData] = useState<KycFormValues | null>(null);
  const [resendStep, setResendStep] = useState<ResendStep>("idle");
  const { run, stop } = useStepper();

  const { mutate, error, mutateAsync } = useMutation({
    mutationFn: async (data: KycFormValues) => {
      try {
        await Promise.all([
          await kycApi.api.kycControllerRequest({
            name: data.name,
            phone: data.phone,
            birthdate: data.birthdate,
          }),
          new Promise((resolve) => setTimeout(resolve, SENDING_MIN_MS)),
        ]);
      } catch {
        throw new RequestError(
          "We couldn't verify your information. Please check and try again.",
        );
      }
    },
  });

  const send = async (data: KycFormValues) => {
    if (formData) {
      return;
    }
    setResendStep("cooldown");
    await mutateAsync(data);
    setFormData(data);
    onSuccessRequest();
    run([{ step: "idle", ms: COOLDOWN_MS }], setResendStep);
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

  return { resendStep, send, resend, reset, error, formData };
}
