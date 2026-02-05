import { css } from "@maroo/styled-system/css";
import { flex } from "@maroo/styled-system/patterns";

import { Label } from "./label";
import { TextInput, type TextInputProps } from "./text-input";

const ErrorMessage = ({ message }: { message: string }) => (
  <span
    className={css({
      textStyle: "caption.regular",
      color: "error",
    })}
  >
    {message}
  </span>
);

interface Props {
  label: string;
  error?: string | undefined;
  validated?: boolean | undefined;
  inputProps?: Omit<TextInputProps, "validated">;
}

export const FormField = ({ label, inputProps, error, validated }: Props) => {
  return (
    <Label>
      {label}
      <div className={flex({ flexDir: "column", gap: "4px" })}>
        <TextInput {...inputProps} validated={validated} />
        {error && <ErrorMessage message={error} />}
      </div>
    </Label>
  );
};
