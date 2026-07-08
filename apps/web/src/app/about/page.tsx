import { Card, CardBody, CardHeader } from '@/components/Card';

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">О проекте V Kvize</h1>

      <Card>
        <CardHeader title="Описание" />
        <CardBody className="prose prose-sm max-w-none text-[var(--vk-text-secondary)] space-y-3">
          <p>
            V Kvize — платформа для проведения интерактивных квизов в реальном времени в стиле
            VK. Организаторы создают опросы, участники подключаются по коду комнаты и отвечают на
            вопросы синхронно.
          </p>
          <p>
            <strong>Стек:</strong> Next.js, Express, Socket.IO, Prisma, <strong>Supabase</strong> (PostgreSQL, Storage).
            Деплой: Vercel + Railway.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Функциональность" />
        <CardBody>
          <ul className="list-disc pl-5 space-y-1 text-[var(--vk-text-secondary)]">
            <li>Вход по имени и аватарке без регистрации</li>
            <li>Подключение по коду комнаты</li>
            <li>Конструктор квизов с 4 типами вопросов</li>
            <li>Real-time проведение через WebSocket</li>
            <li>Подсчёт баллов и лидерборд</li>
            <li>История квизов</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
