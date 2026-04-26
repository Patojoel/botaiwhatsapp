import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth; // Explicit named export

export const config = {
  matcher: ["/dashboard/:path*", "/api-docs/:path*"],
};
