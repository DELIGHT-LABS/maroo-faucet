"use client";

import { css } from "@maroo/styled-system/css";
import { Button, StepCard, StepCards } from "@maroo/ui";
import IconCheck from "@maroo/ui/assets/icon-check.svg?react";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { authStateAtom } from "../siwe/auth-store";
import { ConnectButton } from "../wallet/connect-button";
import { KakaoButton } from "./kakao-button";
import { KycForm } from "./kyc-form";
import { LastVerification } from "./last-verification";
import type { KycFormValues } from "./schema";
import { useRequestVerify } from "./use-request-verify";

const ConnectStep = () => (
  <StepCard active idx={1} title="Connect your wallet">
    <ConnectButton />
  </StepCard>
);

const RequestStep = () => {
  const { status, verified } = useAtomValue(authStateAtom);

  const step = status === "authenticated" ? 2 : 1;

  const [flow, setFlow] = useState<"select-method" | "request-form" | "verify">(
    "select-method",
  );

  const { resendStep, send, resend, reset, formData } = useRequestVerify();

  useEffect(() => {
    if (step === 1) {
      setFlow("select-method");
      reset();
    }
  }, [step]);

  const handleFormSubmit = (data: KycFormValues) => {
    send(data);
    setFlow("verify");
  };

  const handleRetry = () => {
    setFlow("request-form");
  };

  return (
    <StepCard idx={2} title="Verify your identity" active={step === 2}>
      {flow === "select-method" && (
        <>
          {!verified && (
            <>
              <KakaoButton onClick={() => setFlow("request-form")} />
              <p
                className={css({
                  textStyle: "caption.regular",
                  mt: "10px",
                  color: "gray.500",
                })}
              >
                ⓘ You can only verify one wallet per person.
              </p>
            </>
          )}

          {verified && (
            <>
              <Button disabled className={css({ gap: "8px" })}>
                Already verified
                <IconCheck />
              </Button>
              <p
                className={css({
                  textStyle: "caption.regular",
                  mt: "10px",
                  color: "gray.500",
                })}
              >
                This wallet is already linked to an identity.
              </p>
            </>
          )}
        </>
      )}
      {flow === "request-form" && (
        <KycForm onSubmit={handleFormSubmit} initialValues={formData} />
      )}
      {flow === "verify" && (
        <LastVerification
          onRetry={handleRetry}
          onResend={resend}
          resendStep={resendStep}
        />
      )}
    </StepCard>
  );
};

export function VerificationCard() {
  return <StepCards StepOne={<ConnectStep />} StepTwo={<RequestStep />} />;
}
