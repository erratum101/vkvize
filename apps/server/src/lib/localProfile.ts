import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { prisma } from './prisma';

export interface LocalProfileHeaders {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

function readHeader(req: Request, name: string) {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

export function getLocalProfile(req: Request): LocalProfileHeaders | null {
  const id = readHeader(req, 'x-profile-id')?.trim();
  const encodedName = readHeader(req, 'x-profile-name')?.trim();
  const encodedAvatar = readHeader(req, 'x-profile-avatar')?.trim();

  if (!id || !encodedName) return null;

  return {
    id,
    name: decodeURIComponent(encodedName),
    avatarUrl: encodedAvatar ? decodeURIComponent(encodedAvatar) : null,
  };
}

export async function ensureLocalUser(profile: LocalProfileHeaders, role: UserRole = UserRole.BOTH) {
  const email = `${profile.id}@local.vkvize`;
  return prisma.user.upsert({
    where: { id: profile.id },
    update: {
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      role,
    },
    create: {
      id: profile.id,
      email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      role,
    },
  });
}

export async function requireLocalUser(req: Request) {
  const profile = getLocalProfile(req);
  if (!profile) return null;
  return ensureLocalUser(profile);
}
