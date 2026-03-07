import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const basicAuth = req.headers.get("authorization");

  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    if (basicAuth) {
      const authValue = basicAuth.split(" ")[1];
      const [user, pwd] = atob(authValue).split(":");

      if (user === "admin" && pwd === (process.env.ADMIN_PASSWORD || "admin")) {
        return NextResponse.next();
      }
    }

    return new NextResponse("Auth Required.", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
