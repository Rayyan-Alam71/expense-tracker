import { NextRequest, NextResponse } from "next/server";

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function verifySessionToken(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [header, payload, signature] = parts;
    const secret = process.env.AUTH_SECRET || "development-only-change-this-secret";
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signature),
      new TextEncoder().encode(`${header}.${payload}`),
    );
    if (!valid) return false;
    const claims = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload))) as { exp?: number };
    return typeof claims.exp === "number" && claims.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  const token = bearer || request.cookies.get("paisa_auth")?.value;
  const authenticated = token ? await verifySessionToken(token) : false;
  const pathname = request.nextUrl.pathname;

  if (!authenticated && (pathname.startsWith("/dashboard") || pathname.startsWith("/day") || pathname.startsWith("/reports"))) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  if (!authenticated && pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  }
  if (authenticated && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/day/:path*", "/reports/:path*", "/login", "/register", "/api/:path*"],
};
