import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  // If no token and trying to access protected routes, redirect to login
  if (!token) {
    if (path.startsWith("/dashboard") || path.startsWith("/admin") || path.startsWith("/kasir") || path.startsWith("/doctor")) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
    return NextResponse.next();
  }

  // Protect admin routes
  if (path.startsWith("/admin") && token.role !== "admin" && token.role !== "superadmin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Protect kasir routes
  if (path.startsWith("/kasir") && token.role !== "kasir" && token.role !== "admin" && token.role !== "superadmin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Protect doctor routes
  if (path.startsWith("/doctor") && token.role !== "doctor" && token.role !== "admin" && token.role !== "superadmin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/kasir/:path*", "/doctor/:path*"]
};