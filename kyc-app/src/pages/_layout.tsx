import { css } from "@maroo/styled-system/css";
import { vstack } from "@maroo/styled-system/patterns";
import type { ReactNode } from "react";

import { Providers } from "~/app/providers";
import "~/app/styles.css";

type RootLayoutProps = { children: ReactNode };

export default async function RootLayout({ children }: RootLayoutProps) {
  const data = await getData();

  return (
    <div
      className={vstack({
        fontFamily: "Poppins",
        bg: "gray.50",
        pt: { base: "24px", md: "40px" },
        pb: { base: "40px", md: "64px" },
        paddingInline: { base: "16px", md: "80px" },
        minHeight: "100vh",
      })}
    >
      <meta name="description" content={data.description} />
      <link rel="icon" type="image/png" href={data.icon} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
        precedence="font"
      />

      {/* TODO: should link to home page ? */}
      <picture className={css({ alignSelf: "flex-start" })}>
        <source media="(min-width: 768px)" srcSet="/icon.svg" />
        <img src="/icon-mobile.svg" alt="Maroo Logo" />
      </picture>

      <main>
        <Providers>{children}</Providers>
      </main>

      <footer
        className={vstack({
          textStyle: "body2.regular",
          color: "gray.400",
          mt: "auto",
        })}
      >
        <p>Powered by Kakao • Secured on Maroo Chain</p>
      </footer>
    </div>
  );
}

const getData = async () => {
  const data = {
    description: "Verify your real-world identity on-chain",
    icon: "/favicon.svg",
  };

  return data;
};

export const getConfig = async () => {
  return {
    render: "static",
  } as const;
};
