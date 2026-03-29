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
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/contact" ||
    pathname === "/docs" ||
    pathname === "/help" ||
    (pathname.startsWith("/google") && pathname.endsWith(".html")) ||
    pathname === "/subscription/upgrade" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/contact") ||
    pathname.startsWith("/api/stripe/webhook")
  );
}

function isAdminRoute(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/admin-dashboard") ||
    pathname.startsWith("/user-management") ||
    pathname.startsWith("/subscription-management") ||
    pathname.startsWith("/invite-user") ||
    pathname.startsWith("/ai-management") ||
    pathname.startsWith("/admin-settings") ||
    pathname.startsWith("/api-config") ||
    pathname.startsWith("/database-health") ||
    pathname.startsWith("/environment") ||
    pathname.startsWith("/security") ||
    pathname.startsWith("/tools")
  );
}

function getRoleDashboardPath(token: any) {
  if (token?.role === "ADMIN") {
    return token?.isOwner ? "/user-management" : "/admin-dashboard";
  }

  if (token?.role === "PROFESSOR") return "/dashboard";
  if (token?.role === "STUDENT") return "/dashboard";

  return "/dashboard";
}

function handleSubscriptionRedirect(req: NextRequest, token: any) {
  const subscriptionType = token?.subscriptionType;
  const pathname = req.nextUrl.pathname;

  // Paid users (both legacy SubscriptionType and new SubscriptionTier)
  if (["BASIC", "PREMIUM", "ENTERPRISE"].includes(subscriptionType)) {
    if (pathname === "/dashboard") return NextResponse.next();
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // FREE or FREE_TRIAL users — let them through to /dashboard too
  // The actual pages handle billing/access checks via getBillingContext
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return NextResponse.next();
  return NextResponse.redirect(new URL("/dashboard", req.url));
}

function handleDashboardRedirect(req: NextRequest, token: any) {
  const pathname = req.nextUrl.pathname;

  // Admin users
  if (token?.role === "ADMIN") {
    const adminDestination = getRoleDashboardPath(token);
    if (pathname === adminDestination) return NextResponse.next();
    return NextResponse.redirect(new URL(adminDestination, req.url));
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
    invalidSession: (token as any)?.invalidSession,
    subscriptionType: token?.subscriptionType,
    trialExpiresAt: token?.trialExpiresAt,
  });

  if ((token as any)?.invalidSession) {
    const response = NextResponse.redirect(new URL("/auth/signin", req.url));
    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("__Secure-next-auth.session-token");
    return response;
  }

  // Public paths are always allowed
  if (isPublicPath(pathname)) {
    // Special redirect handling for authenticated users on / or /auth/success
    if ((pathname === "/" || pathname === "/auth/success") && token) {
      return handleDashboardRedirect(req, token);
    }
    return NextResponse.next();
  }

  // Role-based redirect when hitting /dashboard
  if (pathname === "/dashboard" && token?.role === "ADMIN") {
    const adminDestination = getRoleDashboardPath(token);
    if (pathname !== adminDestination) {
      return NextResponse.redirect(new URL(adminDestination, req.url));
    }
  }

  // Admin routes: require ADMIN
  if (isAdminRoute(pathname)) {
    if (!token || token.role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Everything else: require auth
  if (!token) {
    // API routes get 401 JSON, pages get redirected
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
