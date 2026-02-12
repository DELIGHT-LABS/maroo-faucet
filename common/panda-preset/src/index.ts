import { definePreset } from "@pandacss/dev";

export const marooPreset = definePreset({
  name: "@maroo/panda-preset",
  conditions: {
    extend: {
      supportHover: ["@media (hover: hover) and (pointer: fine)", "&:hover"],
    },
  },
  theme: {
    extend: {
      tokens: {
        colors: {
          gray: {
            50: { value: "#F9FAFB" },
            100: { value: "#F3F4F6" },
            200: { value: "#E5E7EB" },
            300: { value: "#D1D5DB" },
            400: { value: "#9CA3AF" },
            500: { value: "#6B7280" },
            600: { value: "#4B5462" },
            700: { value: "#374151" },
            800: { value: "#282F3C" },
            900: { value: "#111827" },
          },
          primary: {
            value: "#0096AA",
            600: { value: "#007888" },
            "/5": { value: "rgba(0, 150, 170, 0.05)" },
            "/10": { value: "rgba(0, 150, 170, 0.1)" },
            "/25": { value: "rgba(0, 150, 170, 0.25)" },
          },
          error: {
            value: "#E43440",
            "/10": { value: "rgba(244, 67, 54, 0.1)" },
          },
        },
      },
      textStyles: {
        display1: {
          value: {
            fontSize: "40px",
            fontWeight: "600",
            lineHeight: "48px",
            fontStyle: "normal",
            letterSpacing: "-2%",
          },
        },
        display2: {
          value: {
            fontSize: "32px",
            fontWeight: "600",
            lineHeight: "40px",
            fontStyle: "normal",
            letterSpacing: "-2%",
          },
        },
        h1: {
          value: {
            fontSize: "34px",
            fontWeight: "600",
            lineHeight: "32px",
            fontStyle: "normal",
            letterSpacing: "-1%",
          },
        },
        body1: {
          regular: {
            value: {
              fontSize: "16px",
              fontWeight: "400",
              lineHeight: "24px",
              fontStyle: "normal",
            },
          },
          medium: {
            value: {
              fontSize: "16px",
              fontWeight: "500",
              lineHeight: "24px",
              fontStyle: "normal",
            },
          },
          bold: {
            value: {
              fontSize: "16px",
              fontWeight: "600",
              lineHeight: "24px",
              fontStyle: "normal",
            },
          },
        },
        body2: {
          regular: {
            value: {
              fontSize: "14px",
              fontWeight: "400",
              lineHeight: "20px",
              fontStyle: "normal",
            },
          },
          medium: {
            value: {
              fontSize: "14px",
              fontWeight: "500",
              lineHeight: "20px",
              fontStyle: "normal",
            },
          },
        },
        button: {
          m: {
            value: {
              fontSize: "14px",
              fontWeight: "600",
              lineHeight: "20px",
              fontStyle: "normal",
            },
          },
        },
        caption: {
          regular: {
            value: {
              fontSize: "12px",
              fontWeight: "400",
              lineHeight: "16px",
              fontStyle: "normal",
            },
          },
          medium: {
            value: {
              fontSize: "12px",
              fontWeight: "500",
              lineHeight: "16px",
              fontStyle: "normal",
            },
          },
        },
      },
    },
  },
});
