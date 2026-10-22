/**
 * Password hashing with Node's built-in scrypt — no native add-on needed.
 *
 * Also imported directly by scripts/set-owner-password.ts (run with plain
 * `node`), so this file must stay dependency-free and use only erasable
 * TypeScript syntax (no enums, namespaces, or parameter properties).
 *
 * Stored format: scrypt$<N>$<r>$<p>$<salt b64>$<hash b64>
 */
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LEN = 64;
const SALT_LEN = 16;

export const MIN_PASSWORD_LENGTH = 10;

function derive(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // maxmem must exceed 128 * N * r bytes (32MB at these settings).
    scrypt(password, salt, KEY_LEN, { N: n, r, p, maxmem: 256 * n * r }, (err, key) =>
      err ? reject(err) : resolve(key)
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const hash = await derive(password, salt, N, R, P);
  return ["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await derive(password, Buffer.from(saltB64, "base64"), Number(n), Number(r), Number(p));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * A valid hash of a random password — verified against when the email doesn't
 * exist, so a failed login takes the same time either way and doesn't reveal
 * which emails are registered.
 */
let dummyHash: Promise<string> | null = null;
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  return dummyHash;
}
