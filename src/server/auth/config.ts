import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { authConfig } from './config.edge';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
});
