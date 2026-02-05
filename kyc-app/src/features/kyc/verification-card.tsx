"use client";

import { StepCard, StepCards } from "@maroo/ui";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { authStatusAtom } from "../siwe/auth-store";
import { ConnectButton } from "../wallet/connect-button";
import { KakaoButton } from "./kakao-button";
import { KycForm } from "./kyc-form";
import { LastVerification } from "./last-verification";

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

  useEffect(() => {
    if (step === 1) {
      setFlow("select-method");
    }
  }, [step]);

  return (
    <StepCard idx={2} title="Verify your identity" active={step === 2}>
      {flow === "select-method" && (
        <KakaoButton onClick={() => setFlow("request-form")} />
      )}
      {flow === "request-form" && (
        <KycForm afterSubmit={() => setFlow("verify")} />
      )}
      {flow === "verify" && <LastVerification />}
    </StepCard>
  );
};

export function VerificationCard() {
  return <StepCards StepOne={<ConnectStep />} StepTwo={<RequestStep />} />;
}
