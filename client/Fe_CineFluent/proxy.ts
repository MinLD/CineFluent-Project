import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import { DecodedToken } from "@/app/lib/types/users";

const authPaths = ["/login", "/register"];
const privatePathsAdmin = ["/admin"];
const privatePaths = ["/settings"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get("access_token")?.value;

  console.log("[middleware] pathname:", pathname, "hasToken:", !!sessionToken);

  let roles: string[] | null = null;
  if (sessionToken) {
    try {
      const decoded: DecodedToken = jwtDecode(sessionToken);
      roles = decoded.roles;
    } catch (error) {
      console.error("Invalid token in middleware:", error);
    }
  }

  // if isn't admin then return to home
  if (privatePathsAdmin.some((path) => pathname.startsWith(path))) {
    console.log("[middleware] admin path, roles:", roles);
    if (!roles?.includes("admin")) {
      console.log("[middleware] redirect to / (not admin)");
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // if was tokened then return to home
  if (authPaths.some((path) => pathname.startsWith(path))) {
    if (sessionToken) {
      console.log("[middleware] auth path but already logged in — redirect /");
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // if wasn't tokened then return to login
  if (privatePaths.some((path) => pathname.startsWith(path))) {
    if (!sessionToken) {
      console.log("[middleware] private path but no token — redirect /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  //if admin has in roles then redirect from home to admin dashboard
  if (pathname === "/") {
    if (roles?.includes("admin")) {
      console.log("[middleware] / visited by admin — redirect /admin");
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
};

export const proxy = middleware;

export default proxy;
