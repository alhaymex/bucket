import { randomBytes } from "node:crypto";

export const generateSharedSecret = (byteLength = 32) => {
  return randomBytes(byteLength).toString("base64url");
};
