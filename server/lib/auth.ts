import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [salt, key] = parts;
  const derived = scryptSync(password, salt, 64).toString("hex");

  try {
    const keyBuf = Buffer.from(key, "hex");
    const derivedBuf = Buffer.from(derived, "hex");
    if (keyBuf.length !== derivedBuf.length) return false;
    return timingSafeEqual(keyBuf, derivedBuf);
  } catch (err) {
    return false;
  }
}

export default { hashPassword, verifyPassword };
