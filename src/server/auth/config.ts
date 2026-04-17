import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/server/db';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: {
            roles: {
              include: {
                role: {
                  include: { permissions: { include: { permission: true } } },
                },
              },
            },
          },
        });

        if (!user || user.status !== 'ACTIVE') return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        const permSet = new Set<string>();
        const roleNames: string[] = [];
        for (const ur of user.roles) {
          roleNames.push(ur.role.name);
          for (const rp of ur.role.permissions) permSet.add(rp.permission.key);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: roleNames,
          permissions: [...permSet],
          activeBranchId: user.defaultBranchId ?? null,
        };
      },
    }),
  ],
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
});
