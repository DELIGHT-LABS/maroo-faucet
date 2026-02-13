import BN from "bn.js";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import type { Address } from "viem";
import config from "./config.json";
import { parseURI, RateLimiter, VerifyCaptcha } from "./middlewares";
import type {
  ChainType,
  ERC20Type,
  EVMInstanceAndConfig,
  RateLimiterConfig,
  SendTokenResponse,
} from "./types";
import EVM from "./vms/evm";

const {
  evmchains,
  erc20tokens,
  GLOBAL_RL,
}: {
  evmchains: ChainType[];
  erc20tokens: ERC20Type[];
  GLOBAL_RL: RateLimiterConfig;
} = config as {
  evmchains: ChainType[];
  erc20tokens: ERC20Type[];
  GLOBAL_RL: RateLimiterConfig;
};

dotenv.config();

// Override GLOBAL_RL with environment variables
if (process.env.GLOBAL_RL_REVERSE_PROXIES) {
  const val = Number(process.env.GLOBAL_RL_REVERSE_PROXIES);
  if (!Number.isNaN(val)) {
    GLOBAL_RL.RATELIMIT.REVERSE_PROXIES = val;
  }
}
if (process.env.GLOBAL_RL_MAX_LIMIT) {
  const val = Number(process.env.GLOBAL_RL_MAX_LIMIT);
  if (!Number.isNaN(val)) {
    GLOBAL_RL.RATELIMIT.MAX_LIMIT = val;
  }
}

// Override evmchains with environment variables
const evmchainsWithEnv: ChainType[] = evmchains.map((chain) => {
  const id = chain.ID;
  const envBatchMax = process.env[`${id}_EIP7702_BATCH_MAX_SIZE`];
  const dripAmount = Number(process.env[`${id}_DRIP_AMOUNT`]);
  const maxBalance = Number(process.env[`${id}_MAX_BALANCE`]);
  return {
    ...chain,
    RPC: process.env[`${id}_RPC`] || chain.RPC,
    EXPLORER: process.env[`${id}_EXPLORER`] || chain.EXPLORER,
    MAX_FEE: process.env[`${id}_MAX_FEE`] || chain.MAX_FEE,
    MAX_PRIORITY_FEE:
      process.env[`${id}_MAX_PRIORITY_FEE`] || chain.MAX_PRIORITY_FEE,
    DRIP_AMOUNT: !Number.isNaN(dripAmount) ? dripAmount : chain.DRIP_AMOUNT,
    MAX_BALANCE: !Number.isNaN(maxBalance) ? maxBalance : chain.MAX_BALANCE,
    accountImplementation:
      process.env[`${chain.ID}_ACCOUNT_IMPLEMENTATION`] ||
      chain.accountImplementation ||
      "",
    ...(envBatchMax !== undefined && envBatchMax !== ""
      ? { eip7702BatchMaxSize: Number(envBatchMax) }
      : {}),
  };
});

// Override erc20tokens with environment variables
const erc20tokensWithEnv: ERC20Type[] = erc20tokens.map((token) => ({
  ...token,
  CONTRACTADDRESS:
    process.env[`${token.ID}_CONTRACTADDRESS`] || token.CONTRACTADDRESS,
}));

const app: any = express();
const router: any = express.Router();

const corsAllowOrigins =
  process.env.NODE_ENV === "production" ||
  process.env.NODE_ENV === "development"
    ? [
        /^https:\/\/deploy-preview-\d+--maroo-faucet\.netlify\.app$/, // deploy preview
        ...(process.env.CORS_ALLOW_ORIGINS?.split(",") || []),
      ]
    : [/^http:\/\/localhost:\d+$/];

// Enable CORS for the new Next.js app
app.use(
  cors({
    origin: corsAllowOrigins,
    exposedHeaders: [
      "Retry-After",
      "RateLimit-Limit",
      "RateLimit-Remaining",
      "RateLimit-Reset",
    ],
  }),
);
app.use(parseURI);
app.use(bodyParser.json());

new RateLimiter(app, [GLOBAL_RL]);

new RateLimiter(app, [...evmchainsWithEnv, ...erc20tokensWithEnv]);

// address rate limiter
new RateLimiter(
  app,
  [...evmchainsWithEnv, ...erc20tokensWithEnv],
  (req: any, _res: any) => {
    const addr = req.body?.address;

    if (typeof addr === "string" && addr) {
      return addr.toUpperCase();
    }
  },
);

const captcha: VerifyCaptcha = new VerifyCaptcha(
  app,
  process.env.CAPTCHA_SECRET!,
  process.env.V2_CAPTCHA_SECRET,
);

const evms = new Map<string, EVMInstanceAndConfig>();

// Get the complete config object from the array of config objects (chains) with ID as id
const getChainByID = (
  chains: ChainType[],
  id: string,
): ChainType | undefined => {
  let reply: ChainType | undefined;
  chains.forEach((chain: ChainType): void => {
    if (chain.ID === id) {
      reply = chain;
    }
  });
  return reply;
};

// Populates the missing config keys of the child using the parent's config
const populateConfig = (child: any, parent: any): any => {
  Object.keys(parent || {}).forEach((key) => {
    if (!child[key]) {
      child[key] = parent[key];
    }
  });
  return child;
};

// Setting up instance for EVM chains
evmchainsWithEnv.forEach((chain: ChainType): void => {
  if (!chain.accountImplementation) {
    console.warn(
      `Skipping ${chain.NAME} (${chain.ID}): accountImplementation required (e.g. ${chain.ID}_ACCOUNT_IMPLEMENTATION)`,
    );
    return;
  }
  console.log(`Connecting to ${chain.NAME} (${chain.ID}) at ${chain.RPC}`);

  const chainInstance: EVM = new EVM(
    chain,
    process.env[chain.ID] || process.env.PK,
  );

  evms.set(chain.ID, {
    config: chain,
    instance: chainInstance,
  });
});

// Adding ERC20 token contracts to their HOST evm instances
erc20tokensWithEnv.forEach((token: ERC20Type, i: number): void => {
  if (token.HOSTID) {
    token = populateConfig(token, getChainByID(evmchainsWithEnv, token.HOSTID));
  }

  erc20tokensWithEnv[i] = token;
  const chainId = getChainByID(evmchainsWithEnv, token.HOSTID)?.ID;
  if (!chainId) return;
  const evm = evms.get(chainId);
  if (!evm) return;

  evm?.instance.addERC20Contract(token);
});

// POST request for sending tokens or coins
router.post(
  "/sendToken",
  ...(process.env.NODE_ENV === "production" ? [captcha.middleware] : []),
  async (req: any, res: any) => {
    const address: Address = req.body?.address;
    const chain: string = req.body?.chain;
    const erc20: string | undefined = req.body?.erc20;

    const evm: EVMInstanceAndConfig = evms.get(chain)!;

    if (evm) {
      evm?.instance.sendToken(address, erc20, (data: SendTokenResponse) => {
        const { status, message, txHash } = data;
        res.status(status).send({ message, txHash });
      });
    } else {
      res.status(400).send({ message: "Invalid parameters passed!" });
    }
  },
);

// GET request for fetching all the chain and token configurations
router.get("/getChainConfigs", (_req: any, res: any) => {
  const configs: any = [...evmchainsWithEnv, ...erc20tokensWithEnv];
  res.send({ configs });
});

// GET request for fetching faucet address for the specified chain
router.get("/faucetAddress", (req: any, res: any) => {
  const chain: string = req.query?.chain;
  const evm: EVMInstanceAndConfig = evms.get(chain)!;

  res.send({
    address: evm?.instance.account.address,
  });
});

// GET request for fetching faucet balance for the specified chain or token
router.get("/getBalance", (req: any, res: any) => {
  const chain: string = req.query?.chain;
  const erc20: string | undefined = req.query?.erc20;

  const evm: EVMInstanceAndConfig = evms.get(chain)!;

  const balance: BN = evm?.instance.getBalance(erc20) ?? new BN(0);

  res.status(200).send({
    balance: balance?.toString(),
  });
});

app.use("/api", router);

app.get("/health", (_req: any, res: any) => {
  res.status(200).send("Server healthy");
});

app.get("/ip", (req: any, res: any) => {
  res.status(200).send({
    ip: req.headers["cf-connecting-ip"] || req.ip,
  });
});

// Backend API only - frontend is served by Next.js on port 3000
app.all("*", (_req: any, res: any) => {
  res.status(404).json({
    error: "Not Found",
    message: "Frontend is served at http://localhost:3000",
  });
});

app.listen(process.env.PORT || 8000, () => {
  console.log(`Server started at port ${process.env.PORT || 8000}`);
  console.log(`Frontend available at http://localhost:3000`);
});
