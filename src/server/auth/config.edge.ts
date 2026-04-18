import type { DefaultSession, NextAuthConfig } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      roles: string[];
      permissions: string[];
      activeBranchId: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    roles?: string[];
    permissions?: string[];
    activeBranchId?: string | null;
  }
}

interface AppToken {
  id?: string;
  roles?: string[];
  permissions?: string[];
  activeBranchId?: string | null;
  [key: string]: unknown;
}

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
        t.roles = user.roles ?? [];
        t.permissions = user.permissions ?? [];
        t.activeBranchId = user.activeBranchId ?? null;
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as AppToken;
      if (t.id) session.user.id = t.id;
      session.user.roles = t.roles ?? [];
      session.user.permissions = t.permissions ?? [];
      session.user.activeBranchId = t.activeBranchId ?? null;
      return session;
    },
  },
} satisfies NextAuthConfig;
