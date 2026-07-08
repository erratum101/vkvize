'use client';

import { useAuth } from '@/lib/auth-context';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { ProfileForm } from '@/components/ProfileForm';

export default function DashboardPage() {
  const { user, loading, setProfile } = useAuth();

  if (loading || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 pt-15">
        <Card>
          <CardBody>
            <ProfileForm
              title="Ваш профиль"
              submitLabel="Сохранить"
              onSubmit={(profile) => {
                setProfile(profile);
              }}
            />
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Личный кабинет</h1>
        <div className="flex gap-2">
          <Button variant="secondary" href="/join">
            Войти в квиз
          </Button>
          <Button href="/organizer/quizzes">Мои квизы</Button>
        </div>
      </div>

      <Card>
        <CardHeader title={`Привет, ${user.name}!`} subtitle="Локальный профиль без регистрации" />
        <CardBody className="flex items-center gap-4">
          <Avatar name={user.name} avatarUrl={user.avatarUrl} size="xl" />
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-[var(--vk-text-secondary)]">
              Если аватарка не выбрана, используется первая буква имени и уникальный цвет.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
