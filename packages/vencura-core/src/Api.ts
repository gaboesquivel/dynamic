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

export interface CreateWalletDto {
  /**
   * Chain ID (number) or Dynamic network ID (string). Examples: 421614 (Arbitrum Sepolia), 84532 (Base Sepolia), "solana-mainnet" (Solana Mainnet)
   * @example 421614
   */
  chainId: number | string;
}

export interface SignMessageDto {
  /**
   * Message to sign
   * @example "Hello, World!"
   */
  message: string;
}

export interface SendTransactionDto {
  /**
   * Recipient address
   * @example "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
   */
  to: string;
  /**
   * Amount in ETH
   * @example 0.001
   */
  amount: number;
}

export interface WalletControllerGetBalanceParams {
  /** Wallet ID */
  id: string;
}

export interface WalletControllerSignMessageParams {
  /** Wallet ID */
  id: string;
}

export interface WalletControllerSendTransactionParams {
  /** Wallet ID */
  id: string;
}

export namespace Wallets {
  /**
 * No description
 * @tags wallets
 * @name WalletControllerGetWallets
 * @summary Get all wallets for the authenticated user
 * @request GET:/wallets
 * @secure
 * @response `200` `({
    id?: string,
    address?: string,
  \** Dynamic network ID *\
    network?: string,
  \**
   * Chain type: evm, solana, cosmos, etc.
   * @example "evm"
   *\
    chainType?: string,

})[]` Wallets retrieved successfully
 * @response `401` `void` Unauthorized
*/
  export namespace WalletControllerGetWallets {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      id?: string;
      address?: string;
      /** Dynamic network ID */
      network?: string;
      /**
       * Chain type: evm, solana, cosmos, etc.
       * @example "evm"
       */
      chainType?: string;
    }[];
  }

  /**
 * @description Create a wallet on any supported chain. Provide chainId as a number (e.g., 421614 for Arbitrum Sepolia) or Dynamic network ID string (e.g., "solana-mainnet" for Solana).
 * @tags wallets
 * @name WalletControllerCreateWallet
 * @summary Create a new custodial wallet
 * @request POST:/wallets
 * @secure
 * @response `201` `{
    id?: string,
    address?: string,
  \**
   * Dynamic network ID
   * @example "421614"
   *\
    network?: string,
  \**
   * Chain type
   * @example "evm"
   *\
    chainType?: string,

}` Wallet created successfully
 * @response `400` `void` Invalid or unsupported chain ID
 * @response `401` `void` Unauthorized
*/
  export namespace WalletControllerCreateWallet {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateWalletDto;
    export type RequestHeaders = {};
    export type ResponseBody = {
      id?: string;
      address?: string;
      /**
       * Dynamic network ID
       * @example "421614"
       */
      network?: string;
      /**
       * Chain type
       * @example "evm"
       */
      chainType?: string;
    };
  }

  /**
 * No description
 * @tags wallets
 * @name WalletControllerGetBalance
 * @summary Get wallet balance
 * @request GET:/wallets/{id}/balance
 * @secure
 * @response `200` `{
    balance?: number,

}` Balance retrieved successfully
 * @response `401` `void` Unauthorized
 * @response `404` `void` Wallet not found
*/
  export namespace WalletControllerGetBalance {
    export type RequestParams = {
      /** Wallet ID */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      balance?: number;
    };
  }

  /**
 * No description
 * @tags wallets
 * @name WalletControllerSignMessage
 * @summary Sign a message with wallet private key
 * @request POST:/wallets/{id}/sign
 * @secure
 * @response `200` `{
    signedMessage?: string,

}` Message signed successfully
 * @response `401` `void` Unauthorized
 * @response `404` `void` Wallet not found
*/
  export namespace WalletControllerSignMessage {
    export type RequestParams = {
      /** Wallet ID */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = SignMessageDto;
    export type RequestHeaders = {};
    export type ResponseBody = {
      signedMessage?: string;
    };
  }

  /**
 * No description
 * @tags wallets
 * @name WalletControllerSendTransaction
 * @summary Send transaction on blockchain
 * @request POST:/wallets/{id}/send
 * @secure
 * @response `200` `{
    transactionHash?: string,

}` Transaction sent successfully
 * @response `401` `void` Unauthorized
 * @response `404` `void` Wallet not found
*/
  export namespace WalletControllerSendTransaction {
    export type RequestParams = {
      /** Wallet ID */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = SendTransactionDto;
    export type RequestHeaders = {};
    export type ResponseBody = {
      transactionHash?: string;
    };
  }
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
 * @title Vencura API
 * @version 1.0
 * @contact
 *
 * Custodial wallet API for Vencura. Get your authentication token from the vencura-ui frontend after logging in with Dynamic, then paste it here.
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags health
   * @name AppControllerGetHello
   * @summary Health check endpoint
   * @request GET:/
   * @response `200` `string` Returns a hello world message
   */
  appControllerGetHello = (params: RequestParams = {}) =>
    this.request<string, any>({
      path: `/`,
      method: "GET",
      format: "json",
      ...params,
    });

  wallets = {
    /**
 * No description
 *
 * @tags wallets
 * @name WalletControllerGetWallets
 * @summary Get all wallets for the authenticated user
 * @request GET:/wallets
 * @secure
 * @response `200` `({
    id?: string,
    address?: string,
  \** Dynamic network ID *\
    network?: string,
  \**
   * Chain type: evm, solana, cosmos, etc.
   * @example "evm"
   *\
    chainType?: string,

})[]` Wallets retrieved successfully
 * @response `401` `void` Unauthorized
 */
    walletControllerGetWallets: (params: RequestParams = {}) =>
      this.request<
        {
          id?: string;
          address?: string;
          /** Dynamic network ID */
          network?: string;
          /**
           * Chain type: evm, solana, cosmos, etc.
           * @example "evm"
           */
          chainType?: string;
        }[],
        void
      >({
        path: `/wallets`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * @description Create a wallet on any supported chain. Provide chainId as a number (e.g., 421614 for Arbitrum Sepolia) or Dynamic network ID string (e.g., "solana-mainnet" for Solana).
 *
 * @tags wallets
 * @name WalletControllerCreateWallet
 * @summary Create a new custodial wallet
 * @request POST:/wallets
 * @secure
 * @response `201` `{
    id?: string,
    address?: string,
  \**
   * Dynamic network ID
   * @example "421614"
   *\
    network?: string,
  \**
   * Chain type
   * @example "evm"
   *\
    chainType?: string,

}` Wallet created successfully
 * @response `400` `void` Invalid or unsupported chain ID
 * @response `401` `void` Unauthorized
 */
    walletControllerCreateWallet: (
      data: CreateWalletDto,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          id?: string;
          address?: string;
          /**
           * Dynamic network ID
           * @example "421614"
           */
          network?: string;
          /**
           * Chain type
           * @example "evm"
           */
          chainType?: string;
        },
        void
      >({
        path: `/wallets`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags wallets
 * @name WalletControllerGetBalance
 * @summary Get wallet balance
 * @request GET:/wallets/{id}/balance
 * @secure
 * @response `200` `{
    balance?: number,

}` Balance retrieved successfully
 * @response `401` `void` Unauthorized
 * @response `404` `void` Wallet not found
 */
    walletControllerGetBalance: (
      { id, ...query }: WalletControllerGetBalanceParams,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          balance?: number;
        },
        void
      >({
        path: `/wallets/${id}/balance`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags wallets
 * @name WalletControllerSignMessage
 * @summary Sign a message with wallet private key
 * @request POST:/wallets/{id}/sign
 * @secure
 * @response `200` `{
    signedMessage?: string,

}` Message signed successfully
 * @response `401` `void` Unauthorized
 * @response `404` `void` Wallet not found
 */
    walletControllerSignMessage: (
      { id, ...query }: WalletControllerSignMessageParams,
      data: SignMessageDto,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          signedMessage?: string;
        },
        void
      >({
        path: `/wallets/${id}/sign`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags wallets
 * @name WalletControllerSendTransaction
 * @summary Send transaction on blockchain
 * @request POST:/wallets/{id}/send
 * @secure
 * @response `200` `{
    transactionHash?: string,

}` Transaction sent successfully
 * @response `401` `void` Unauthorized
 * @response `404` `void` Wallet not found
 */
    walletControllerSendTransaction: (
      { id, ...query }: WalletControllerSendTransactionParams,
      data: SendTransactionDto,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          transactionHash?: string;
        },
        void
      >({
        path: `/wallets/${id}/send`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
