import { css } from "styled-system/css";
import { center, vstack } from "styled-system/patterns";

import { getChainConfigs } from "~/features/faucet/api";
import { FaucetCard } from "~/features/faucet/faucet-card";

import { MAROO_ID } from "~/shared/lib/env";
import { formatNumber } from "~/shared/lib/format";

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

      <FaucetCard />

      <ul
        className={vstack({
          w: "full",
          p: "20px",
          gap: "4px",
          rounded: "12px",
          bg: "primary./5",
          backdropFilter: "blur(9px)",
          color: "primary.600",
          alignItems: "flex-start",
          textStyle: "body2.regular",
        })}
      >
        <li>
          • Limit : {data.maroo?.RATELIMIT.MAX_LIMIT || 1} request
          {(data.maroo?.RATELIMIT.MAX_LIMIT || 1) > 1 && "s"} per address every{" "}
          {data.maroo?.RATELIMIT.WINDOW_SIZE || 1440} minutes
        </li>
        <li>
          • Drip amount: {formatNumber(data.maroo?.DRIP_AMOUNT || 2)}{" "}
          {data.maroo?.TOKEN || "tokens"} per request
        </li>
        <li>• Test tokens have no real value</li>
      </ul>
    </div>
  );
}

const getData = async () => {
  const configs = await getChainConfigs();
  const maroo = configs.find((config) => config.ID === MAROO_ID);

  const data = {
    title: "Maroo Faucet - Get Test Tokens",
    headline: "Maroo Testnet Faucet",
    body: "Get test tokens for Maroo networks and subnets",
    maroo,
  };

  return data;
};

export const getConfig = async () => {
  return {
    render: "static",
  } as const;
};
