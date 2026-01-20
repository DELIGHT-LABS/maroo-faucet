import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cva, cx, type RecipeVariantProps } from "styled-system/css";

const button = cva({
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    w: "full",
    rounded: "8px",
    _hover: { cursor: "pointer" },
    _disabled: { pointerEvents: "none" },
  },
  variants: {
    color: {
      primary: {
        bg: "primary",
        color: "white",
        padding: "10px 20px",
        _hover: { bg: "primary.600" },
        _disabled: { bg: "primary", opacity: 0.25, pointerEvents: "none" },
        textStyle: "button.m",
      },
      ghost: {
        bg: "gray.100",
        color: "gray.500",
        padding: "8px 14px",
        _hover: { bg: "gray.300" },
        _disabled: { bg: "gray.50", color: "gray.300", pointerEvents: "none" },
        textStyle: "caption.medium",
      },
    },
  },
  defaultVariants: {
    color: "primary",
  },
});

type ButtonVariants = RecipeVariantProps<typeof button>;

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  as?: React.ElementType;
}

export const Button = ({
  as = "button",
  color,
  className,
  ...props
}: PropsWithChildren<Props & ButtonVariants>) => (
  // TODO: Slot for polymorphic 'as' prop
  <button {...props} className={cx(button({ color }), className)}>
    {props.children}
  </button>
);
