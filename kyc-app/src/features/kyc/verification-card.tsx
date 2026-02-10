"use client";

import { StepCard, StepCards } from "@maroo/ui";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { authStatusAtom } from "../siwe/auth-store";
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
  const authStatus = useAtomValue(authStatusAtom);

  const step = authStatus === "authenticated" ? 2 : 1;
  const [flow, setFlow] = useState<"select-method" | "request-form" | "verify">(
    "select-method",
  );

  const { resendStep, send, resend, reset } = useRequestVerify();

  useEffect(() => {
    if (step === 1) {
      setFlow("select-method");
    }
  }, [step]);

  const handleFormSubmit = (data: KycFormValues) => {
    send(data);
    setFlow("verify");
  };

  const handleRetry = () => {
    reset();
    setFlow("select-method");
  };

  return (
    <StepCard idx={2} title="Verify your identity" active={step === 2}>
      {flow === "select-method" && (
        <KakaoButton onClick={() => setFlow("request-form")} />
      )}
      {flow === "request-form" && <KycForm onSubmit={handleFormSubmit} />}
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
