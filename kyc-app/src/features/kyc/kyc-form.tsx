"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useForm } from "react-hook-form";
import { vstack } from "styled-system/patterns";

import { Button } from "~/shared/ui/button";
import { FormCheck } from "~/shared/ui/form-check";
import { FormField } from "~/shared/ui/form-field";

import { formatPhone } from "./phone-number";
import { type KycFormValues, kycFormSchema } from "./schema";

export const KycForm = ({ afterSubmit }: { afterSubmit: () => void }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, touchedFields },
  } = useForm({
    resolver: valibotResolver(kycFormSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      phone: "",
      birthDate: "",
      agreement: false,
    },
  });

  const onSubmit = (data: KycFormValues) => {
    console.log("KYC Form submitted:", data);
    afterSubmit();
  };

  return (
    <form
      className={vstack({ alignItems: "flex-start", gap: "16px" })}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField
        label="Name"
        inputProps={{
          ...register("name"),
          type: "text",
          placeholder: "홍길동",
        }}
        error={errors.name?.message}
        validated={touchedFields.name && !errors.name}
      />

      <FormField
        label="Phone Number"
        inputProps={{
          ...register("phone", {
            onChange: (e) => {
              e.target.value = formatPhone(e.target.value);
            },
          }),
          type: "tel",
          inputMode: "numeric",
          placeholder: "010-1234-5678",
        }}
        error={errors.phone?.message}
        validated={touchedFields.phone && !errors.phone}
      />

      <FormField
        label="Date of Birth"
        inputProps={{
          ...register("birthDate"),
          type: "text",
          inputMode: "numeric",
          placeholder: "19900101",
        }}
        error={errors.birthDate?.message}
        validated={touchedFields.birthDate && !errors.birthDate}
      />

      <FormCheck
        label="I agree to the collection and use of personal information."
        inputProps={{
          ...register("agreement"),
        }}
      />

      <Button type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? "Requesting..." : "Request Verification"}
      </Button>
    </form>
  );
};
