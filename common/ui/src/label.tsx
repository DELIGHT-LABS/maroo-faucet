import { css } from "@maroo/styled-system/css";
import type { PropsWithChildren } from "react";

export const Label = ({ children }: PropsWithChildren) => (
  <label
    className={css({
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      w: "full",
      textStyle: "body1.bold",
      color: "gray.900",
    })}
  >
    {children}
  </label>
);
