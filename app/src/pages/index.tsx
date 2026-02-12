import { css } from "@maroo/styled-system/css";
import { center, vstack } from "@maroo/styled-system/patterns";

import { getChainConfigs } from "~/features/faucet/api";
import { FaucetCard } from "~/features/faucet/faucet-card";

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
          bg: "primary/5",
          backdropFilter: "blur(9px)",
          color: "primary.600",
          alignItems: "flex-start",
          textStyle: "body2.regular",
        })}
      >
        <li>
          • Receive {formatNumber(data.maroo.DRIP_AMOUNT)} {data.maroo.TOKEN}{" "}
          per request
        </li>
        <li>
          • Max {data.maroo.RATELIMIT.MAX_LIMIT} request
          {data.maroo.RATELIMIT.MAX_LIMIT > 1 && "s"} every{" "}
          {data.maroo.RATELIMIT.WINDOW_SIZE} mins
        </li>
        <li>
          • Unavailable if holding {formatNumber(data.maroo.MAX_BALANCE)}{" "}
          {data.maroo.TOKEN}
        </li>
        <li className={css({ textStyle: "body2.medium" })}>
          • Test tokens have no real value
        </li>
      </ul>
    </div>
  );
}

const getData = async () => {
  const configs = await getChainConfigs();
  const [maroo] = configs;

  if (!maroo) {
    throw new Error("Maroo config not found");
  }

  const data = {
    title: "Maroo Faucet - Get Test Tokens",
    headline: "Maroo Testnet Faucet",
    body: "Get test tokens for Maroo networks",
    maroo,
  };

  return data;
};

export const getConfig = async () => {
  return {
    render: "static",
  } as const;
};
