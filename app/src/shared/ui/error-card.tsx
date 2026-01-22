import { flex } from "styled-system/patterns";

import IconCaution from "../assets/icon-cuation.svg?react";

export const ErrorCard = ({ message }: { message: string }) => (
  <div
    className={flex({
      gap: "10px",
      rounded: "8px",
      alignItems: "center",
      border: "0.5px solid",
      borderColor: "error",
      bg: "error./10",
      p: "10px",
      color: "error",
      textStyle: "body2.regular",
      wordBreak: "break-word",
    })}
  >
    <IconCaution />
    <p>{message}</p>
  </div>
);
