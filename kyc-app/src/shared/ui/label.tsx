import type { PropsWithChildren } from "react";
import { css } from "styled-system/css";

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
