import { z } from "zod";

const SCHEME_PATTERN = /^[a-z][a-z\d+\-.]*:/i;
const DECIMAL_OCTET_PATTERN = /^(0|[1-9]\d{0,2})$/;
const NUMERIC_IPV4_PART_PATTERN = /^(?:0x[0-9a-f]+|\d+)$/i;
const BLOCKED_HOSTNAMES = new Set(["localhost", "localhost.localdomain"]);
const BLOCKED_HOSTNAME_SUFFIXES = [
  ".localhost",
  ".local",
  ".localdomain",
  ".internal",
  ".home.arpa",
  ".lan",
];

const normalizeUrlInput = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) return trimmed;

  return SCHEME_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const isPublicHttpUrl = (value: string) => {
  try {
    const url = new URL(value);

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password &&
      isPublicHostname(url.hostname)
    );
  } catch {
    return false;
  }
};

const publicHttpUrlSchema = z
  .string()
  .trim()
  .transform(normalizeUrlInput)
  .refine(hasSafeRawUrlSyntax, {
    message: "URL uses an unsupported host format.",
  })
  .pipe(
    z.url({
      protocol: /^https?$/,
      normalize: true,
    }),
  )
  .refine(isPublicHttpUrl, {
    message: "URL must point to a public HTTP or HTTPS website.",
  })
  .transform(normalizePublicHttpUrl);

export const urlSchema = publicHttpUrlSchema;

export const AddLinkSchema = z.object({
  url: urlSchema,
  note: z.string().optional(),
  collectionId: z.string(),
  tags: z.array(z.string()),
});

export type AddLinkType = z.infer<typeof AddLinkSchema>;

function normalizePublicHttpUrl(value: string) {
  const url = new URL(value);

  if (url.hostname.endsWith(".") && !isIpHostname(url.hostname)) {
    url.hostname = url.hostname.slice(0, -1);
  }

  return url.toString();
}

function hasSafeRawUrlSyntax(value: string) {
  const rawHost = getRawHost(value);

  if (!rawHost) return false;

  return !isAmbiguousIpv4Hostname(rawHost);
}

function getRawHost(value: string) {
  const schemeEnd = value.indexOf("://");

  if (schemeEnd === -1) return null;

  const authorityStart = schemeEnd + 3;
  const authorityEnd = value.slice(authorityStart).search(/[/?#]/);
  const authority =
    authorityEnd === -1
      ? value.slice(authorityStart)
      : value.slice(authorityStart, authorityStart + authorityEnd);

  if (!authority || authority.includes("@")) return null;

  if (authority.startsWith("[")) {
    const bracketEnd = authority.indexOf("]");

    if (bracketEnd === -1) return null;

    return authority.slice(0, bracketEnd + 1).toLowerCase();
  }

  const host = authority.split(":", 1)[0];

  return host ? host.toLowerCase().replace(/\.$/, "") : null;
}

function isAmbiguousIpv4Hostname(hostname: string) {
  if (hostname.startsWith("[") && hostname.endsWith("]")) return false;

  const parts = hostname.split(".");

  if (!parts.every((part) => NUMERIC_IPV4_PART_PATTERN.test(part))) {
    return false;
  }

  if (parts.length !== 4) return true;

  return !parts.every(isCanonicalDecimalOctet);
}

function isCanonicalDecimalOctet(value: string) {
  if (!DECIMAL_OCTET_PATTERN.test(value)) return false;

  const octet = Number(value);

  return Number.isInteger(octet) && octet >= 0 && octet <= 255;
}

function isPublicHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");

  if (!normalized) return false;

  if (isIpv6Hostname(normalized)) {
    return isPublicIpv6(normalized);
  }

  const ipv4 = parseIpv4(normalized);

  if (ipv4) {
    return isPublicIpv4(ipv4);
  }

  if (BLOCKED_HOSTNAMES.has(normalized)) return false;

  if (BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => normalized.endsWith(suffix))) {
    return false;
  }

  if (!normalized.includes(".")) return false;

  // Zod 4 exposes this regex for domain-only hostname validation.
  return z.regexes.domain.test(normalized);
}

function isIpHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");

  return Boolean(parseIpv4(normalized)) || isIpv6Hostname(normalized);
}

function parseIpv4(hostname: string) {
  const parts = hostname.split(".");

  if (parts.length !== 4) return null;

  const octets = parts.map((part) => {
    if (!DECIMAL_OCTET_PATTERN.test(part)) return null;

    const octet = Number(part);

    return Number.isInteger(octet) && octet >= 0 && octet <= 255 ? octet : null;
  });

  if (octets.some((octet) => octet === null)) return null;

  return octets as [number, number, number, number];
}

function isPublicIpv4([first, second, third]: [
  number,
  number,
  number,
  number,
]) {
  if (first === 0) return false;
  if (first === 10) return false;
  if (first === 100 && second >= 64 && second <= 127) return false;
  if (first === 127) return false;
  if (first === 169 && second === 254) return false;
  if (first === 172 && second >= 16 && second <= 31) return false;
  if (first === 192 && second === 0 && third === 0) return false;
  if (first === 192 && second === 0 && third === 2) return false;
  if (first === 192 && second === 88 && third === 99) return false;
  if (first === 192 && second === 168) return false;
  if (first === 198 && (second === 18 || second === 19)) return false;
  if (first === 198 && second === 51 && third === 100) return false;
  if (first === 203 && second === 0 && third === 113) return false;
  if (first >= 224) return false;

  return true;
}

function isIpv6Hostname(hostname: string) {
  return hostname.startsWith("[") && hostname.endsWith("]");
}

function isPublicIpv6(hostname: string) {
  const hextets = parseIpv6Hextets(hostname);

  if (!hextets) return false;

  if (isIpv4MappedIpv6(hextets)) {
    return isPublicIpv4([
      hextets[6] >> 8,
      hextets[6] & 0xff,
      hextets[7] >> 8,
      hextets[7] & 0xff,
    ]);
  }

  if (hextets.every((hextet) => hextet === 0)) return false;
  if (hextets.slice(0, 7).every((hextet) => hextet === 0) && hextets[7] === 1) {
    return false;
  }

  const [first, second] = hextets;

  if (first === 0) return false;
  if (
    first === 0x0064 &&
    second === 0xff9b &&
    hextets.slice(2, 6).every((hextet) => hextet === 0)
  ) {
    return false;
  }
  if (first === 0x0100 && hextets.slice(1, 4).every((hextet) => hextet === 0)) {
    return false;
  }
  if (first === 0x2001 && second === 0x0db8) return false;
  if (first === 0x2002) return false;
  if (first >= 0xfc00 && first <= 0xfdff) return false;
  if (first >= 0xfe80 && first <= 0xfebf) return false;
  if (first >= 0xff00 && first <= 0xffff) return false;

  return true;
}

function parseIpv6Hextets(hostname: string) {
  let value = hostname.slice(1, -1).split("%", 1)[0].toLowerCase();

  if (!value.includes(":")) return null;

  if (value.includes(".")) {
    const lastColon = value.lastIndexOf(":");
    const ipv4 = parseIpv4(value.slice(lastColon + 1));

    if (!ipv4) return null;

    value = `${value.slice(0, lastColon)}:${((ipv4[0] << 8) | ipv4[1]).toString(
      16,
    )}:${((ipv4[2] << 8) | ipv4[3]).toString(16)}`;
  }

  const compressedParts = value.split("::");

  if (compressedParts.length > 2) return null;

  const left = parseIpv6HextetList(compressedParts[0]);
  const right =
    compressedParts.length === 2 ? parseIpv6HextetList(compressedParts[1]) : [];

  if (!left || !right) return null;

  if (compressedParts.length === 1) {
    return left.length === 8 ? left : null;
  }

  const missingCount = 8 - left.length - right.length;

  if (missingCount < 1) return null;

  const hextets = [...left, ...Array(missingCount).fill(0), ...right];

  return hextets.length === 8 ? hextets : null;
}

function parseIpv6HextetList(value: string) {
  if (!value) return [];

  const hextets = value.split(":").map((part) => {
    if (!/^[0-9a-f]{1,4}$/i.test(part)) return NaN;

    return parseInt(part, 16);
  });

  return hextets.some((hextet) => Number.isNaN(hextet)) ? null : hextets;
}

function isIpv4MappedIpv6(hextets: number[]) {
  return (
    hextets.slice(0, 5).every((hextet) => hextet === 0) && hextets[5] === 0xffff
  );
}
