"use node";

import dns from "node:dns";
import { Agent, fetch as undiciFetch, type Dispatcher } from "undici";
import {
  isPublicIpHostname,
  isPublicUrlHostname,
  urlSchema,
} from "@bucket/common";

export const METADATA_FETCH_TIMEOUT_MS = 8_000;
export const METADATA_MAX_REDIRECTS = 5;
export const METADATA_MAX_HTML_BYTES = 1_048_576;
export const OEMBED_FETCH_TIMEOUT_MS = 5_000;
export const OEMBED_MAX_JSON_BYTES = 65_536;

const METADATA_ALLOWED_CONTENT_TYPES = ["text/html", "application/xhtml+xml"];
const JSON_ALLOWED_CONTENT_TYPES = [
  "application/json",
  "application/json; charset=utf-8",
  "text/json",
];
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);
const BLOCKED_IP_ERROR_CODE = "ERR_BUCKET_BLOCKED_IP";

export type SafeFetchFailureReason =
  | "invalid_url"
  | "blocked_hostname"
  | "blocked_ip"
  | "timeout"
  | "too_many_redirects"
  | "unsupported_content_type"
  | "response_too_large"
  | "network_error"
  | "invalid_response";

export type SafeFetchTextResult =
  | {
      ok: true;
      url: string;
      status: number;
      headers: Headers;
      text: string;
    }
  | {
      ok: false;
      url: string;
      status?: number;
      reason: SafeFetchFailureReason;
      errorMessage?: string;
    };

type SafeFetchArgs = {
  url: string;
  timeoutMs: number;
  maxBytes: number;
  maxRedirects: number;
  allowedContentTypes: readonly string[];
  userAgent?: string;
};

type Fetcher = (
  url: string,
  init: RequestInit & { dispatcher?: Dispatcher },
) => Promise<Response>;

class BlockedIpError extends Error {
  code = BLOCKED_IP_ERROR_CODE;

  constructor(address: string) {
    super(`Blocked resolved IP address: ${address}`);
  }
}

export async function safeFetchText(
  args: SafeFetchArgs,
): Promise<SafeFetchTextResult> {
  const dispatcher = createGuardedDispatcher(args.timeoutMs);

  try {
    return await safeFetchTextWithFetcher(
      args,
      (url, init) =>
        undiciFetch(url, {
          ...(init as Parameters<typeof undiciFetch>[1]),
          dispatcher,
        }) as unknown as Promise<Response>,
    );
  } finally {
    await dispatcher.close().catch(() => undefined);
  }
}

export async function fetchMetadataHtml(url: string) {
  return safeFetchText({
    url,
    timeoutMs: METADATA_FETCH_TIMEOUT_MS,
    maxBytes: METADATA_MAX_HTML_BYTES,
    maxRedirects: METADATA_MAX_REDIRECTS,
    allowedContentTypes: METADATA_ALLOWED_CONTENT_TYPES,
    userAgent: "Mozilla/5.0",
  });
}

export async function fetchSmallJson(args: SafeFetchArgs) {
  return safeFetchText({
    ...args,
    allowedContentTypes:
      args.allowedContentTypes.length > 0
        ? args.allowedContentTypes
        : JSON_ALLOWED_CONTENT_TYPES,
  });
}

export async function safeFetchTextWithFetcher(
  args: SafeFetchArgs,
  fetcher: Fetcher,
): Promise<SafeFetchTextResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), args.timeoutMs);

  try {
    return await fetchRedirectChain({
      ...args,
      fetcher,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted || isAbortError(error)) {
      return {
        ok: false,
        url: args.url,
        reason: "timeout",
      };
    }

    if (isBlockedIpError(error)) {
      return {
        ok: false,
        url: args.url,
        reason: "blocked_ip",
        errorMessage: getErrorMessage(error),
      };
    }

    return {
      ok: false,
      url: args.url,
      reason: "network_error",
      errorMessage: getErrorMessage(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function isPublicResolvedAddress(address: string) {
  return isPublicIpHostname(address);
}

function createGuardedDispatcher(timeoutMs: number) {
  return new Agent({
    connectTimeout: timeoutMs,
    bodyTimeout: timeoutMs,
    headersTimeout: timeoutMs,
    connect: {
      lookup: guardedLookup,
    } as never,
  });
}

function guardedLookup(hostname: string, options: unknown, callback: unknown) {
  const lookupOptions =
    typeof options === "function"
      ? ({} as dns.LookupAllOptions)
      : (options as dns.LookupAllOptions);
  const lookupCallback = (
    typeof options === "function" ? options : callback
  ) as (
    error: NodeJS.ErrnoException | null,
    address: string | dns.LookupAddress[],
    family?: number,
  ) => void;

  dns.lookup(
    hostname,
    {
      ...lookupOptions,
      all: true,
    },
    (error, addresses) => {
      if (error) {
        lookupCallback(error, "");
        return;
      }

      const blockedAddress = addresses.find(
        ({ address }) => !isPublicResolvedAddress(address),
      );

      if (blockedAddress) {
        lookupCallback(new BlockedIpError(blockedAddress.address), "");
        return;
      }

      if (lookupOptions.all) {
        lookupCallback(null, addresses);
        return;
      }

      const [firstAddress] = addresses;

      if (!firstAddress) {
        lookupCallback(new Error("DNS lookup returned no addresses"), "");
        return;
      }

      lookupCallback(null, firstAddress.address, firstAddress.family);
    },
  );
}

async function fetchRedirectChain({
  url,
  maxBytes,
  maxRedirects,
  allowedContentTypes,
  userAgent,
  fetcher,
  signal,
}: SafeFetchArgs & { fetcher: Fetcher; signal: AbortSignal }) {
  let currentUrl = url;
  let redirectCount = 0;

  while (true) {
    const validatedUrl = validateFetchUrl(currentUrl);

    if (!validatedUrl.ok) {
      return {
        ok: false,
        url: currentUrl,
        reason: validatedUrl.reason,
      } satisfies SafeFetchTextResult;
    }

    currentUrl = validatedUrl.url;

    const response = await fetcher(currentUrl, {
      redirect: "manual",
      signal,
      headers: {
        "User-Agent": userAgent ?? "Mozilla/5.0",
      },
    });

    if (REDIRECT_STATUS_CODES.has(response.status)) {
      if (redirectCount >= maxRedirects) {
        return {
          ok: false,
          url: currentUrl,
          status: response.status,
          reason: "too_many_redirects",
        } satisfies SafeFetchTextResult;
      }

      const location = response.headers.get("location");

      if (!location) {
        return {
          ok: false,
          url: currentUrl,
          status: response.status,
          reason: "invalid_response",
        } satisfies SafeFetchTextResult;
      }

      currentUrl = new URL(location, currentUrl).toString();
      redirectCount += 1;
      continue;
    }

    if (response.status < 200 || response.status >= 300) {
      return {
        ok: false,
        url: currentUrl,
        status: response.status,
        reason: "invalid_response",
      } satisfies SafeFetchTextResult;
    }

    if (!isAllowedContentType(response.headers, allowedContentTypes)) {
      return {
        ok: false,
        url: currentUrl,
        status: response.status,
        reason: "unsupported_content_type",
      } satisfies SafeFetchTextResult;
    }

    const body = await readTextWithLimit(response, maxBytes);

    if (!body.ok) {
      return {
        ok: false,
        url: currentUrl,
        status: response.status,
        reason: body.reason,
      } satisfies SafeFetchTextResult;
    }

    return {
      ok: true,
      url: currentUrl,
      status: response.status,
      headers: response.headers,
      text: body.text,
    } satisfies SafeFetchTextResult;
  }
}

function validateFetchUrl(
  value: string,
):
  | { ok: true; url: string }
  | { ok: false; reason: "invalid_url" | "blocked_hostname" } {
  const parsed = urlSchema.safeParse(value);

  if (parsed.success) {
    const url = new URL(parsed.data);

    return url.protocol === "http:" || url.protocol === "https:"
      ? { ok: true, url: parsed.data }
      : { ok: false, reason: "invalid_url" };
  }

  try {
    const url = new URL(value);

    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password &&
      !isPublicUrlHostname(url.hostname)
    ) {
      return { ok: false, reason: "blocked_hostname" };
    }
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  return { ok: false, reason: "invalid_url" };
}

function isAllowedContentType(
  headers: Headers,
  allowedContentTypes: readonly string[],
) {
  const contentType = normalizeContentType(headers.get("content-type"));

  if (!contentType) return false;

  return allowedContentTypes
    .map((value) => normalizeContentType(value))
    .some((allowedContentType) => allowedContentType === contentType);
}

function normalizeContentType(value: string | null) {
  return value?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

async function readTextWithLimit(
  response: Response,
  maxBytes: number,
): Promise<
  { ok: true; text: string } | { ok: false; reason: "response_too_large" }
> {
  if (!response.body) {
    return { ok: true, text: "" };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;

    if (totalBytes > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return { ok: false, reason: "response_too_large" };
    }

    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return {
    ok: true,
    text: new TextDecoder().decode(bytes),
  };
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function isBlockedIpError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  if ("code" in error && error.code === BLOCKED_IP_ERROR_CODE) return true;

  return "cause" in error ? isBlockedIpError(error.cause) : false;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "unknown_error";
}
