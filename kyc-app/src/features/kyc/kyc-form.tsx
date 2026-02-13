"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { vstack } from "@maroo/styled-system/patterns";
import { Button, FormCheck, FormField } from "@maroo/ui";
import { useForm } from "react-hook-form";

import { formatPhone } from "./phone-number";
import { type KycFormValues, kycFormSchema } from "./schema";

interface Props {
  onSubmit: (data: KycFormValues) => void;
  initialValues?: Partial<KycFormValues> | null;
}

export const KycForm = ({ onSubmit, initialValues }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, touchedFields },
  } = useForm({
    resolver: valibotResolver(kycFormSchema),
    mode: "onTouched",
    defaultValues: {
      name: initialValues?.name ?? "",
      phone: initialValues?.phone ?? "",
      birthdate: initialValues?.birthdate ?? "",
      agreement: initialValues?.agreement ?? false,
    },
  });

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
          ...register("birthdate"),
          type: "text",
          inputMode: "numeric",
          placeholder: "19900101",
        }}
        error={errors.birthdate?.message}
        validated={touchedFields.birthdate && !errors.birthdate}
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
