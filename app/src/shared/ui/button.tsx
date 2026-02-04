import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cva, cx, type RecipeVariantProps } from "styled-system/css";

const button = cva({
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
        _supportHover: { bg: "primary.600" },
        _active: { bg: "primary.600" },
        _disabled: {
          bg: "primary/10",
          pointerEvents: "none",
          color: "primary",
        },
        textStyle: "button.m",
      },
      ghost: {
        bg: "gray.100",
        color: "gray.500",
        padding: "8px 14px",
        _supportHover: { bg: "gray.300" },
        _active: { bg: "gray.300" },
        _disabled: { bg: "gray.50", color: "gray.300", pointerEvents: "none" },
        textStyle: "caption.medium",
      },
      transparent: {
        bg: "transparent",
        padding: "8px 20px",
        color: "gray.500",
        textStyle: "button.m",
      },
    },
    size: {
      full: { w: "full" },
      fit: { w: "fit-content" },
    },
  },
  defaultVariants: {
    color: "primary",
    size: "full",
  },
});

type ButtonVariants = RecipeVariantProps<typeof button>;

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  as?: React.ElementType;
}

export const Button = ({
  as = "button",
  color,
  size,
  className,
  ...props
}: PropsWithChildren<Props & ButtonVariants>) => (
  // TODO: Slot for polymorphic 'as' prop
  <button {...props} className={cx(button({ color, size }), className)}>
    {props.children}
  </button>
);
