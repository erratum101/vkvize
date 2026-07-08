# VK Quiz MVP

Платформа для проведения квизов в реальном времени в стиле VK.

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | Next.js 16, React, Tailwind CSS |
| Backend | Express, Socket.IO, Prisma |
| BaaS | **Supabase** (Auth, PostgreSQL, Storage) |
| Деплой | Vercel (web) + Railway/Render (API + WebSocket) |

## Быстрый старт

### 1. Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. **Settings → Database** — скопируйте `DATABASE_URL` (pooler, 6543) и `DIRECT_URL` (5432)
3. **Settings → API** — скопируйте `URL`, `anon key`, `service_role key`
4. **SQL Editor** — выполните [`supabase/setup.sql`](supabase/setup.sql) (bucket для картинок)
5. **Authentication → Providers → Email** — для MVP можно отключить «Confirm email»

### 2. Переменные окружения

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env.local
```

Заполните ключи Supabase в обоих файлах.

### 3. Миграции и seed

```bash
npm install
npm run db:push
npm run db:seed
```

### 4. Запуск

```bash
npm run dev
```

- Web: http://localhost:3000
- API + WebSocket: http://localhost:4000

## Архитектура с Supabase

```
Next.js (Vercel)
  ├── Supabase Auth (login/register)
  ├── Supabase Storage (изображения вопросов)
  └── REST + WebSocket → Express (Railway)
                              └── Supabase PostgreSQL (Prisma)
```

- **Auth:** Supabase Auth на клиенте; сервер проверяет JWT через `supabase.auth.getUser()`
- **Профиль:** таблица `User` в Postgres, `id` = `auth.users.id`
- **Storage:** bucket `quiz-images`, публичные URL
- **Real-time квиз:** Socket.IO на Express (без изменений)

## Деплoy

### Vercel (frontend)

Root: `apps/web`. Env:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`

### Railway / Render (backend)

Env:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (Supabase pooler)
- `DIRECT_URL` (для миграций)
- `CORS_ORIGIN` (URL Vercel)

## Документация

- [Пояснительная записка](docs/POYASNITELNAYA_ZAPISKA.md)
- [Дизайн](docs/DESIGN.md)
