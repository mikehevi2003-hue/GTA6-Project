import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimitAsync } from "@/lib/security/rate-limit";

/**
 * Edge auth gate.
 *  - Refreshes the Supabase session cookie on every matched request.
 *  - Edge rate-limits /api/auth/* against credential brute-force (5 req / 15m per IP).
 *  - Unauthenticated /api/* (outside the allowlist) -> 401 JSON.
 *  - Unauthenticated pages (including /admin) -> redirect /login.
 *  - Authenticated /login -> redirect /.
 *  - Authenticated /api/* responses are never cached.
 */

const PUBLIC_PATHS = [
  "/login",
  "/reset-password",
  "/terms",
  "/privacy",
  "/refunds",
  "/dmca",
  "/api/health",
  "/api/auth",
  "/api/unsubscribe",
  "/api/og",
  "/api/webhooks/yappy",
  "/api/webhooks/card",
  "/api/stripe/webhook",
  "/manifest.json",
  "/sw.js",
  "/_next",
  "/favicon.ico"
] as const;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

function withCookies(target: NextResponse, source: NextResponse): NextResponse {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  return target;
}

function buildOriginUrl(pathname: string, request: NextRequest): URL {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "") || "http";
    return new URL(pathname, `${proto}://${host}`);
  }
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return url;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = isPublicPath(pathname);
  const isApi = isApiPath(pathname);

  if (pathname.startsWith("/api/auth/")) {
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip")?.trim() ||
      "local";
    const isSignout = pathname === "/api/auth/signout";
    const rl = await checkRateLimitAsync(
      isSignout ? `auth-signout:${clientIp}` : `auth-edge:${clientIp}`,
      isSignout ? 30 : 5,
      15 * 60_000
    );
    if (!rl.allowed) {
      const retryAfterSeconds = Math.max(1, Math.ceil(rl.retryAfterMs / 1000));
      return NextResponse.json(
        {
          error: "RATE_LIMITED",
          message: "Too many authentication attempts. Please wait 15 minutes before retrying."
        },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": String(retryAfterSeconds)
          }
        }
      );
    }
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let userId: string | null = null;

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        }
      }
    });

    // IMPORTANT: getUser() revalidates the JWT with Supabase Auth (never trust getSession() here).
    try {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    } catch {
      userId = null;
    }
  }

  // Webhooks / auth callback / legal pages / static: always pass through.
  if (isPublic) {
    if (userId && (pathname === "/login" || pathname.startsWith("/login/"))) {
      return withCookies(NextResponse.redirect(buildOriginUrl("/", request)), response);
    }
    if (isApi) {
      response.headers.set("Cache-Control", "no-store");
    }
    return response;
  }

  if (!userId) {
    if (isApi) {
      return withCookies(
        NextResponse.json(
          { error: "UNAUTHORIZED" },
          { status: 401, headers: { "Cache-Control": "no-store" } }
        ),
        response
      );
    }
    return withCookies(NextResponse.redirect(buildOriginUrl("/login", request)), response);
  }

  if (isApi) {
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)"
  ]
};
