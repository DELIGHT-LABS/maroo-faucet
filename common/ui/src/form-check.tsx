import { flex } from "@maroo/styled-system/patterns";
import type { InputHTMLAttributes } from "react";

import { Checkbox } from "./check-box";

interface Props {
  label: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
}

export const FormCheck = ({ label, inputProps }: Props) => {
  return (
    <label className={flex({ gap: "10px", alignItems: "center" })}>
      <Checkbox {...inputProps} />
      {label}
    </label>
  );
};
