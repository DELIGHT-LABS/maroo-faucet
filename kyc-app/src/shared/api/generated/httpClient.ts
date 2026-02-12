/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface LiveResponse {
  /** @example "ok" */
  status: "ok";
}

export interface ReadyResponse {
  /** @example "ok" */
  status: "ok";
  /** @example {"database":"ok","cache":"ok"} */
  checks: object;
}

export interface VersionResponse {
  /**
   * Application version
   * @example "1.0.0"
   */
  version: string;
}

export interface MessageRequest {
  /**
   * EVM wallet address (EIP-55 checksum)
   * @example "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"
   */
  address: string;
}

export interface MessageResponse {
  /**
   * ERC-4361 formatted SIWE message
   * @example "kyc.example.com wants you to sign in..."
   */
  message: string;
}

export interface SignInRequest {
  /**
   * Original SIWE message that was signed
   * @example "kyc.example.com wants you to sign in..."
   */
  message: string;
  /**
   * Signature hex string
   * @example "0x..."
   */
  signature: string;
}

export interface SignInResponse {
  /**
   * KYC attestation status
   * @example false
   */
  verified: boolean;
}

export interface SessionResponse {
  /**
   * Authenticated wallet address
   * @example "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"
   */
  address: string;
  /**
   * Chain ID
   * @example 1
   */
  chainId: number;
  /**
   * Session expiration time
   * @example "2026-02-04T12:00:00Z"
   */
  expiresAt: string;
}

export interface LogoutResponse {
  /**
   * Logout success
   * @example true
   */
  success: boolean;
}

export interface KycRequestBody {
  /**
   * Phone number without hyphens (11 digits)
   * @example "01012345678"
   */
  phone: string;
  /**
   * Real name
   * @example "홍길동"
   */
  name: string;
  /**
   * Birthdate in yyyyMMdd format
   * @example "19900115"
   */
  birthdate: string;
}

export interface KycVerifyResponse {
  /** @example true */
  verified: boolean;
  /**
   * EAS attestation UID
   * @example "0x1234567890abcdef..."
   */
  attestationUid: string;
  /**
   * Transaction hash
   * @example "0xabcdef1234567890..."
   */
  txHash: string;
  /** @example "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B" */
  address: string;
  /** @example "2026-02-03T12:03:00Z" */
  issuedAt: string;
  /** @example "2027-02-03T12:03:00Z" */
  expiresAt: string;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title KYC Attestation
 * @version 0.2.1-dev.2ef1841
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  health = {
    /**
     * @description Returns ok if the application process is alive.
     *
     * @tags Health
     * @name HealthControllerLive
     * @summary Liveness probe
     * @request GET:/health/live
     */
    healthControllerLive: (params: RequestParams = {}) =>
      this.request<LiveResponse, any>({
        path: `/health/live`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns ok if the application is ready to serve requests (database and cache are connected).
     *
     * @tags Health
     * @name HealthControllerReady
     * @summary Readiness probe
     * @request GET:/health/ready
     */
    healthControllerReady: (params: RequestParams = {}) =>
      this.request<ReadyResponse, void>({
        path: `/health/ready`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  version = {
    /**
     * @description Returns the current application version.
     *
     * @tags Version
     * @name VersionControllerGetVersion
     * @summary Application version
     * @request GET:/version
     */
    versionControllerGetVersion: (params: RequestParams = {}) =>
      this.request<VersionResponse, any>({
        path: `/version`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  api = {
    /**
     * @description Generates an ERC-4361 SIWE message and nonce for wallet signature.
     *
     * @tags Auth
     * @name AuthControllerMessage
     * @summary Generate SIWE message
     * @request POST:/api/v1/auth/message
     */
    authControllerMessage: (data: MessageRequest, params: RequestParams = {}) =>
      this.request<MessageResponse, void>({
        path: `/api/v1/auth/message`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Verifies the signed `ERC-4361` message and checks KYC attestation status.
     *
     * @tags Auth
     * @name AuthControllerSignIn
     * @summary Sign in with Ethereum
     * @request POST:/api/v1/auth/signin
     * @secure
     */
    authControllerSignIn: (data: SignInRequest, params: RequestParams = {}) =>
      this.request<SignInResponse, void>({
        path: `/api/v1/auth/signin`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns the current authenticated session information.
     *
     * @tags Auth
     * @name AuthControllerSession
     * @summary Get current session
     * @request GET:/api/v1/auth/session
     * @secure
     */
    authControllerSession: (params: RequestParams = {}) =>
      this.request<SessionResponse, void>({
        path: `/api/v1/auth/session`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Deletes the current session and clears the session cookie.
     *
     * @tags Auth
     * @name AuthControllerLogout
     * @summary Logout
     * @request POST:/api/v1/auth/logout
     * @secure
     */
    authControllerLogout: (params: RequestParams = {}) =>
      this.request<LogoutResponse, void>({
        path: `/api/v1/auth/logout`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags KYC
     * @name KycControllerRequest
     * @summary Request KYC identity verification
     * @request POST:/api/v1/kyc/request
     * @secure
     */
    kycControllerRequest: (data: KycRequestBody, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/api/v1/kyc/request`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags KYC
     * @name KycControllerVerify
     * @summary Verify KYC and create attestation
     * @request POST:/api/v1/kyc/verify
     * @secure
     */
    kycControllerVerify: (params: RequestParams = {}) =>
      this.request<KycVerifyResponse, void>({
        path: `/api/v1/kyc/verify`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),
  };
}
