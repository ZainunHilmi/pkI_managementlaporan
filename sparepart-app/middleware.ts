import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Langkah 5 SRS §9 + FR-AUTH-02 / §5.6: proteksi route berbasis role.
// - /admin/* hanya ADMIN
// - /user/* hanya USER
// - /login dan / yang sudah login di-redirect ke panel sesuai role
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Sudah login tapi buka /login, /signup, atau / -> lempar ke dashboard sesuai role
    if (token && (pathname === "/login" || pathname === "/signup" || pathname === "/")) {
      const url = req.nextUrl.clone();
      url.pathname = token.role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Rute publik: landing, login, signup, unauthorized, dan callback NextAuth
        if (
          pathname === "/" ||
          pathname === "/login" ||
          pathname === "/signup" ||
          pathname === "/unauthorized" ||
          pathname.startsWith("/api/auth")
        ) {
          return true;
        }

        // Selain itu wajib login
        if (!token) return false;

        // Cek role ketat sesuai SRS FR-AUTH-02
        if (pathname.startsWith("/admin")) return token.role === "ADMIN";
        if (pathname.startsWith("/user")) return token.role === "USER";

        return !!token;
      },
    },
    pages: { signIn: "/login" },
  }
);

// Matcher mencakup panel + entry point (SRS §5.6 diperluas untuk redirect / dan /login)
export const config = {
  matcher: ["/admin/:path*", "/user/:path*", "/login", "/signup", "/"],
};
