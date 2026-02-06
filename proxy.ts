import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/admin-login" ||
    pathname === "/auth/signin" ||
    pathname === "/auth/signup" ||
    pathname === "/auth/success" ||
    pathname === "/subscription/upgrade" ||
    pathname === "/trial-dashboard" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/debug/") ||
    pathname.startsWith("/test/") ||
    pathname.startsWith("/api/debug/") ||
    pathname.startsWith("/api/redirect") ||
    pathname.startsWith("/api/auth/")
  );
}

function isAdminRoute(pathname: string) {
  return (
    pathname.startsWith("/user-management") ||
    pathname.startsWith("/subscription-management") ||
    pathname.startsWith("/invite-user") ||
    pathname.startsWith("/ai-management")
  );
}

function handleSubscriptionRedirect(req: NextRequest, token: any) {
  const subscriptionType = token?.subscriptionType || "FREE_TRIAL";

  // Avoid loops: if already on destination, do nothing
  const pathname = req.nextUrl.pathname;

  // Trial logic
  if (subscriptionType === "FREE_TRIAL") {
    const trialExpired =
      token?.trialExpiresAt && new Date() > new Date(token.trialExpiresAt);

    if (trialExpired) {
      if (pathname === "/subscription/upgrade") return NextResponse.next();
      return NextResponse.redirect(new URL("/subscription/upgrade", req.url));
    }

    if (pathname === "/trial-dashboard") return NextResponse.next();
    return NextResponse.redirect(new URL("/trial-dashboard", req.url));
  }

  // Paid users
  if (["BASIC", "PREMIUM", "ENTERPRISE"].includes(subscriptionType)) {
    if (pathname === "/dashboard") return NextResponse.next();
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Default
  if (pathname === "/trial-dashboard") return NextResponse.next();
  return NextResponse.redirect(new URL("/trial-dashboard", req.url));
}

function handleDashboardRedirect(req: NextRequest, token: any) {
  const pathname = req.nextUrl.pathname;

  // Admin users
  if (token?.role === "ADMIN") {
    if (pathname === "/user-management") return NextResponse.next();
    return NextResponse.redirect(new URL("/user-management", req.url));
  }

  return handleSubscriptionRedirect(req, token);
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionCookie =
    req.cookies.get("next-auth.session-token") ||
    req.cookies.get("__Secure-next-auth.session-token");

  // IMPORTANT: Pass the SAME secret NextAuth uses
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  console.log("🔍 Proxy Debug:", {
    pathname,
    isAuthenticated: !!token,
    hasSessionCookie: !!sessionCookie,
    tokenEmail: token?.email,
    userRole: token?.role,
    subscriptionType: token?.subscriptionType,
    trialExpiresAt: token?.trialExpiresAt,
  });

  // Public paths are always allowed
  if (isPublicPath(pathname)) {
    // Special redirect handling for authenticated users on / or /auth/success
    if ((pathname === "/" || pathname === "/auth/success") && token) {
      return handleDashboardRedirect(req, token);
    }
    return NextResponse.next();
  }

  // Admin routes: require ADMIN
  if (isAdminRoute(pathname)) {
    if (!token || token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Everything else: require auth
  if (!token) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect all routes except public ones
    "/((?!api/auth|_next/static|_next/image|favicon.ico|icons).*)",
  ],
};
