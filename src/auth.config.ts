import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  providers: [
    // On laisse les providers vides ici ou on définit juste la structure
    // car le "authorize" a besoin de Prisma qui n'est pas dispo en Edge.
    // Auth.js fusionnera cela avec la config complète dans auth.ts (Node.js).
    Credentials({}),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDashboardAction = nextUrl.pathname.startsWith("/dashboard");
      const isApiDocsAction = nextUrl.pathname.startsWith("/api-docs");

      // Temporairement, on laisse passer pour le dashboard si l'utilisateur demande 
      // d'enlever l'auth, mais on garde la logique pour la prod.
      if (isDashboardAction || isApiDocsAction) {
        return true; // Accès libre temporaire
        // if (isLoggedIn) return true;
        // return false; // Redirect to login
      }
      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
