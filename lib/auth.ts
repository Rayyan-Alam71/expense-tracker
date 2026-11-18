import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type AuthUser = { id: number; name: string; username: string };

const JWT_TTL_SECONDS = 60 * 60 * 24 * 7;

function secret() {
  return process.env.AUTH_SECRET || "development-only-change-this-secret";
}

function base64Url(value: Buffer | string) {
  return Buffer.from(value).toString("base64url");
}

export function signJwt(user: AuthUser) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({ sub: String(user.id), name: user.name, username: user.username, iat: now, exp: now + JWT_TTL_SECONDS }));
  const signature = createHmac("sha256", secret()).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

export function verifyJwt(token: string): AuthUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expected = createHmac("sha256", secret()).update(`${header}.${payload}`).digest("base64url");
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: string; name?: string; username?: string; exp?: number };
    if (!claims.sub || !claims.name || !claims.username || !claims.exp || claims.exp <= Math.floor(Date.now() / 1000)) return null;
    return { id: Number(claims.sub), name: claims.name, username: claims.username };
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, encoded: string) {
  const [scheme, salt, hash] = encoded.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const supplied = scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "hex");
  return stored.length === supplied.length && timingSafeEqual(supplied, stored);
}

export function tokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7);
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)paisa_auth=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getAuthenticatedUser(request: Request) {
  const token = tokenFromRequest(request);
  return token ? verifyJwt(token) : null;
}
