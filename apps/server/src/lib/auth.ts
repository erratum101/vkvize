import { UserRole } from '@prisma/client';
import { supabaseAdmin } from './supabase';
import { prisma } from './prisma';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}

export async function verifyAccessToken(token: string): Promise<AuthUser | null> {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const profile = await prisma.user.findUnique({
    where: { id: data.user.id },
    select: { id: true, email: true, role: true },
  });

  if (!profile) return null;

  return {
    userId: profile.id,
    email: profile.email,
    role: profile.role,
  };
}
