import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1];
    const padded = base64.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  if (request.nextUrl.pathname.startsWith("/subscriptions")) {
    const url = request.nextUrl.clone();
    url.pathname = url.pathname.replace(/^\/subscriptions/, "/bills");
    return NextResponse.redirect(url);
  }

  // Lightweight auth check: decode the access token JWT locally
  // instead of making an RPC call to Supabase Auth via getClaims().
  // This saves ~100-300ms per navigation.
  const accessToken = request.cookies.get("sb-access-token")?.value
    || request.cookies.get("sb-localhost-auth-token")?.value;

  let isAuthed = false;
  if (accessToken) {
    const payload = parseJwtPayload(accessToken);
    if (payload && typeof payload.exp === "number") {
      isAuthed = payload.exp * 1000 > Date.now();
    }
  }

  if (
    !isAuthed &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
