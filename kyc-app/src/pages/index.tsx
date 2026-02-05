import { css } from "styled-system/css";
import { center } from "styled-system/patterns";
import { VerificationCard } from "~/features/kyc/verification-card";

export default async function HomePage() {
  const data = await getData();

  return (
    <div
      className={center({
        flexDir: "column",
        marginInline: "auto",
        pt: { base: "72px", md: "128px" },
        pb: "140px",
        w: "fit-content",
      })}
    >
      <title>{data.title}</title>
      <h1
        className={css({
          textStyle: { base: "h1", md: "display1" },
          mb: { base: "8px", md: "16px" },
          color: "primary",
          textAlign: "center",
        })}
      >
        {data.headline}
      </h1>
      <p
        className={css({
          textStyle: { base: "body2.regular", md: "body1.regular" },
          color: "gray.700",
          mb: { base: "24px", md: "64px" },
          textAlign: "center",
        })}
      >
        {data.body}
      </p>

      <VerificationCard />
    </div>
  );
}

const getData = async () => {
  const data = {
    title: "Maroo Identity Verification",
    headline: "Maroo Identity Verification",
    body: "Verify your real-world identity on-chain",
  };

  return data;
};

export const getConfig = async () => {
  return {
    render: "static",
  } as const;
};
