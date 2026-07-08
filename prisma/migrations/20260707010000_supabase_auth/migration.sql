-- Migration: Supabase auth integration (remove passwordHash, User.id = auth.users.id)

ALTER TABLE "User" DROP COLUMN IF EXISTS "passwordHash";

-- If migrating from old schema where id had default uuid(), new users must use auth id
-- Existing rows may need manual migration
