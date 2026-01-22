import type { ReactNode } from "react";
import { css } from "styled-system/css";
import { vstack } from "styled-system/patterns";

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
        href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,700;1,400;1,700&display=swap"
        precedence="font"
      />

      {/* TODO: should link to home page ? */}
      <picture className={css({ alignSelf: "flex-start" })}>
        <source media="(min-width: 768px)" srcSet="/icon.svg" />
        <img src="/icon-mobile.svg" alt="Maroo Faucet Logo" />
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
        <p>Copyright © 2022 Lux Industries Inc.</p>
        <p>Modified work Copyright © {new Date().getFullYear()} DELIGHT LABS</p>
      </footer>
    </div>
  );
}

const getData = async () => {
  const data = {
    description: "Request test tokens for Maroo testnets and subnets",
    icon: "/favicon.svg",
  };

  return data;
};

export const getConfig = async () => {
  return {
    render: "static",
  } as const;
};
