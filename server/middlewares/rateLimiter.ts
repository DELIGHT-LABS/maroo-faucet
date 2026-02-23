import type { Express } from "express";
import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import { searchIP } from "range_check";
import type { RateLimiterConfig } from "../types";

export class RateLimiter {
  PATH: string;

  constructor(app: Express, configs: RateLimiterConfig[], keyGenerator?: any) {
    this.PATH = configs[0].RATELIMIT.PATH || "/api/sendToken";

    const rateLimiters = new Map<string, RateLimitRequestHandler>();
    configs.forEach((config) => {
      rateLimiters.set(config.ID, this.getLimiter(config, keyGenerator));
    });

    if (configs[0]?.RATELIMIT?.REVERSE_PROXIES) {
      app.set("trust proxy", configs[0]?.RATELIMIT?.REVERSE_PROXIES);
    }

    app.use(this.PATH, (req: any, res: any, next: any) => {
      if (this.PATH === "/api/sendToken" && req.body.chain) {
        return rateLimiters.get(
          req.body.erc20 ? req.body.erc20 : req.body.chain,
          // TODO: remove ! assertion
        )!(req, res, next);
      } else {
        // TODO: remove ! assertion
        return rateLimiters.get(configs[0].ID)!(req, res, next);
      }
    });
  }

  getLimiter(
    config: RateLimiterConfig,
    keyGenerator?: any,
  ): RateLimitRequestHandler {
    const limiter = rateLimit({
      windowMs: config.WINDOW_SIZE * 60 * 1000,
      max: config.MAX_LIMIT,
      standardHeaders: true,
      legacyHeaders: false,
      skipFailedRequests: config.SKIP_FAILED_REQUESTS ?? true,
      message: {
        message: `Too many requests. Please try again after ${config.WINDOW_SIZE} minutes`,
      },
      keyGenerator: keyGenerator
        ? keyGenerator
        : (req, _res) => {
            const ip = this.getIP(req);
            if (ip != null) {
              return ip;
            }
          },
    });

    return limiter;
  }

  getIP(req: any) {
    const ip = req.headers["cf-connecting-ip"] || req.ip;
    return searchIP(ip);
  }
}
