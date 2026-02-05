import { cva, cx, type RecipeVariantProps } from "styled-system/css";
import { circle } from "styled-system/patterns";

const idx = cva({
  base: {
    textStyle: "body1.bold",
  },
  variants: {
    color: {
      primary: {
        color: "primary",
        bg: "primary/10",
      },
      ghost: {
        color: "#B0B0B0",
        bg: "gray.100",
      },
    },
  },
  defaultVariants: {
    color: "primary",
  },
});

type IdxVariants = RecipeVariantProps<typeof idx>;

type Props = IdxVariants & {
  i: number;
};

export const Idx = ({ i, color }: Props) => (
  <div className={cx(idx({ color }), circle({ size: "32px" }))}>{i}</div>
);
