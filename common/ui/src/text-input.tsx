import { css, cx } from "@maroo/styled-system/css";
import type { HTMLInputTypeAttribute, InputHTMLAttributes } from "react";

import IconCheck from "./assets/icon-check.svg?react";

const inputWrapper = css({
  position: "relative",
  display: "flex",
  alignItems: "center",
  width: "100%",
});

const inputStyle = css({
  width: "100%",
  padding: "10px 12px",
  textStyle: "body1.medium",
  _placeholder: {
    color: "gray.300",
  },
  color: "gray.900",
  rounded: "6px",
  border: "1px solid",
  borderColor: "gray.300",
  outlineColor: "primary",
  outlineWidth: "1px",
  caretColor: "primary",
});

const validatedInputStyle = css({
  paddingRight: "40px",
});

const iconStyle = css({
  position: "absolute",
  right: "12px",
  color: "primary",
  width: "20px",
  height: "20px",
});

type TextInputType = Extract<
  HTMLInputTypeAttribute,
  "text" | "tel" | "email" | "password" | "number" | "search" | "url"
>;

export type TextInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  type?: TextInputType;
  validated?: boolean | undefined;
};

export const TextInput = ({
  className,
  validated,
  ...props
}: TextInputProps) => (
  <div className={inputWrapper}>
    <input
      {...props}
      className={cx(inputStyle, validated && validatedInputStyle, className)}
    />
    {validated && <IconCheck className={iconStyle} />}
  </div>
);
