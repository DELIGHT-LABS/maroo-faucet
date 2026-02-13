"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { css } from "@maroo/styled-system/css";
import { vstack } from "@maroo/styled-system/patterns";

import { Button, ErrorCard, FormCheck, FormField } from "@maroo/ui";
import IconSpinner from "@maroo/ui/assets/icon-spinner.svg?react";
import { useForm } from "react-hook-form";
import { formatPhone } from "./phone-number";
import { type KycFormValues, kycFormSchema } from "./schema";

interface Props {
  onSubmit: (data: KycFormValues) => Promise<void>;
  initialValues?: Partial<KycFormValues> | null;
}

export const KycForm = ({ onSubmit, initialValues }: Props) => {
  const {
    register,
    setError,
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
      onSubmit={handleSubmit(async (data) => {
        try {
          await onSubmit(data);
        } catch (e) {
          if (e instanceof Error) {
            setError("root", { message: e.message });
            return;
          }

          setError("root", {
            message: "An unexpected error occurred. Please try again.",
          });
        }
      })}
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

      {errors.root?.message && (
        <div className={css({ w: "full" })}>
          <ErrorCard message={errors.root.message} />
        </div>
      )}

      <Button
        type="submit"
        disabled={!isValid || isSubmitting}
        className={css({ gap: "4px" })}
      >
        {isSubmitting ? (
          <>
            Requesting...
            <IconSpinner className={css({ animation: "spin" })} />
          </>
        ) : (
          "Request Verification"
        )}
      </Button>
    </form>
  );
};
