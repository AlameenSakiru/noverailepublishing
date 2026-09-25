import { NextResponse, type NextRequest } from "next/server";

// Blocked path segments that represent sensitive system or private files
const FORBIDDEN_PATH_PATTERNS = [
  /^\/manuscripts(\/.*)?$/i,
  /^\/storage(\/.*)?$/i,
  /^\/\.env/i,
  /^\/\.git/i,
  /\.(env|sql|sqlite|bak|log|ini|sh|bat)$/i,
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Path traversal defense
  if (pathname.includes("..") || pathname.includes("%2e%2e") || pathname.includes("%2E%2E")) {
    return new NextResponse("Forbidden: Invalid path characters", { status: 403 });
  }

  // 2. Block direct HTTP access to private storage, legacy manuscript routes, and secret files
  for (const pattern of FORBIDDEN_PATH_PATTERNS) {
    if (pattern.test(pathname)) {
      return new NextResponse("Not Found", { status: 404 });
    }
  }

  // 3. Fast Edge Guard for Admin Routes: Redirect unauthenticated requests before SSR
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const sessionCookie = request.cookies.get("noveraile_session");
    if (!sessionCookie?.value) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("error", "session_required");
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Fast Edge Guard for Customer Library
  if (pathname.startsWith("/my-library")) {
    const sessionCookie = request.cookies.get("noveraile_session");
    if (!sessionCookie?.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", "/my-library");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - covers/* (public book cover artwork)
     */
    "/((?!_next/static|_next/image|favicon.ico|covers).*)",
  ],
};
