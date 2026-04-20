import type { DefaultSession, NextAuthConfig } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      activeBranchId: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    activeBranchId?: string | null;
  }
}

interface AppToken {
  id?: string;
  activeBranchId?: string | null;
  [key: string]: unknown;
}

// Roles and permissions are NOT stored in the JWT — they are loaded fresh from
// the DB in getSession() to avoid cookie size limits and stale permission issues.
export const authConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  trustHost: true,
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      const t = token as AppToken;
      if (user) {
        t.id = user.id as string;
        t.activeBranchId = user.activeBranchId ?? null;
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as AppToken;
      if (t.id) session.user.id = t.id;
      session.user.activeBranchId = t.activeBranchId ?? null;
      return session;
    },
  },
} satisfies NextAuthConfig;
