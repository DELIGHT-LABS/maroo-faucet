import { css, cx } from "@maroo/styled-system/css";
import { circle } from "@maroo/styled-system/patterns";
import type { InputHTMLAttributes } from "react";

import IconCheckThick from "./assets/icon-check-thick.svg?react";

const wrapper = css({
  display: "inline-flex",
  cursor: "pointer",
});

const hiddenInput = css({
  position: "absolute",
  opacity: 0,
  width: 0,
  height: 0,
});

const customCheckbox = css({
  ...circle.raw({ size: "20px" }),
  border: "1px solid",
  borderColor: "gray.300",
  "input:checked + &": {
    backgroundColor: "primary/15",
    border: "none",
  },
});

const checkIcon = css({
  w: "full",
  display: "none",
  "input:checked + span > &": {
    display: "block",
  },
});

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const Checkbox = ({ className, ...props }: CheckboxProps) => (
  <label className={cx(wrapper, className)}>
    <input type="checkbox" className={hiddenInput} {...props} />
    <span className={customCheckbox}>
      <IconCheckThick className={checkIcon} />
    </span>
  </label>
);
