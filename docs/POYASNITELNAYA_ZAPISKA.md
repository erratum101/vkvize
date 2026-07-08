# Пояснительная записка: VK Quiz MVP

## 1. Цель и задачи проекта

**Цель:** MVP веб-приложения для проведения квизов в реальном времени в стиле VK.

**Задачи:** регистрация/авторизация, конструктор квизов, real-time проведение по коду комнаты, подсчёт баллов, личный кабинет.

## 2. Обоснование стека

| Компонент | Выбор | Обоснование |
|-----------|-------|-------------|
| Frontend | Next.js 16 | SSR, маршрутизация, деплoy на Vercel |
| Backend | Express + Socket.IO | REST API + persistent WebSocket для квиза |
| BaaS | **Supabase** | Auth, PostgreSQL, Storage в одном сервисе |
| ORM | Prisma | Типобезопасность, работа с Supabase Postgres |
| Real-time квиз | Socket.IO | State machine фаз, таймер, античит |
| Деплой | Vercel + Railway | Frontend serverless; backend с WebSocket |

**Почему Supabase:** не нужен отдельный PostgreSQL и самописная auth; Storage для изображений вопросов; бесплатный tier для MVP.

## 3. Архитектура

```
Клиент (Next.js)
  → Supabase Auth (JWT)
  → Supabase Storage (картинки)
  → Express API + Socket.IO
       → Supabase PostgreSQL (Prisma)
```

Профиль пользователя (`User`) хранится в Postgres с `id`, совпадающим с `auth.users.id`.

## 4. Этапы разработки

1. UI/UX (Figma, Miro) + VK design tokens
2. Prisma schema на Supabase Postgres
3. Supabase Auth + sync профиля через `/api/auth/profile`
4. CRUD квизов, upload в Supabase Storage
5. Socket.IO — комнаты, фазы, баллы
6. Next.js страницы, деплой Vercel + Railway

## 5. Ссылки

| Ресурс | URL |
|--------|-----|
| Figma | https://www.figma.com/design/87S1sP6C7WkkNEHOze24bQ/Vkvize?node-id=3-55 |
| Miro | https://miro.com/app/board/PLACEHOLDER |
| GitHub | https://github.com/PLACEHOLDER/vkvize |

---

*VK Quiz MVP, 2026.*
