import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge auth gate.
 *  - Refreshes the Supabase session cookie on every matched request.
 *  - Unauthenticated /api/* (outside the allowlist) -> 401 JSON.
 *  - Unauthenticated pages -> redirect /login.
 *  - Authenticated /login -> redirect /.
 *  - Authenticated /api/* responses are never cached.
 */

const PUBLIC_PATHS = [
  "/login",
  "/terms",
  "/privacy",
  "/refunds",
  "/api/auth",
  "/api/webhooks/yappy",
  "/api/webhooks/card",
  "/api/stripe/webhook",
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
