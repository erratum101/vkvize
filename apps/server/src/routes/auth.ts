import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const profileSchema = z.object({
  name: z.string().min(2),
  role: z.enum(['ORGANIZER', 'PARTICIPANT', 'BOTH']).default('BOTH'),
});

router.post('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const data = profileSchema.parse(req.body);
    const token = req.headers.authorization!.slice(7);
    const { data: authData, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !authData.user) return res.status(401).json({ error: 'Invalid token' });

    const email = authData.user.email;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await prisma.user.upsert({
      where: { id: authData.user.id },
      update: { name: data.name, role: data.role as UserRole, email },
      create: {
        id: authData.user.id,
        email,
        name: data.name,
        role: data.role as UserRole,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    res.status(201).json({ user });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    console.error(e);
    res.status(500).json({ error: 'Profile sync failed' });
  }
});

export default router;
