"use client";

import type { PropsWithChildren, ReactNode } from "react";
import { css, cx } from "styled-system/css";
import { divider, flex } from "styled-system/patterns";

import { Idx } from "~/shared/ui/idx";

interface StepCardProps {
  idx: number;
  title: string;
  active?: boolean;
  className?: string;
}

export const StepCard = ({
  active,
  idx,
  title,
  children,
  className,
}: PropsWithChildren<StepCardProps>) => {
  return (
    <div className={cx(flex({ flexDir: "column" }), className)}>
      <div className={flex({ gap: "16px", mb: "16px", alignItems: "center" })}>
        <Idx i={idx} color={active ? "primary" : "ghost"} />
        <p
          className={css({
            textStyle: "body1.bold",
            color: active ? "gray.900" : "gray.400",
          })}
        >
          {title}
        </p>
      </div>
      {active && children}
    </div>
  );
};

interface StepCardsProps {
  StepOne: ReactNode;
  StepTwo: ReactNode;
}
export function StepCards({ StepOne, StepTwo }: StepCardsProps) {
  return (
    <div
      className={css({
        border: "1px solid",
        borderColor: "primary",
        bg: "white",
        rounded: "16px",
        w: { base: "full", md: "500px" },
        mb: "16px",
        p: { base: "24px", md: "32px" },
      })}
    >
      {StepOne}

      <div
        className={divider({
          mt: { base: "20px", md: "32px" },
          mb: { base: "20px", md: "32px" },
          color: "gray.200",
        })}
      />

      {StepTwo}
    </div>
  );
}
