'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardBody } from '@/components/Card';
import { ProfileForm } from '@/components/ProfileForm';
import { normalizeName } from '@/lib/local-profile';

export default function RegisterPage() {
  const { user, setProfile } = useAuth();
  const router = useRouter();
  const [profileError, setProfileError] = useState<string>();

  return (
    <div className="mx-auto max-w-md px-4 py-12 pt-15">
      <Card>
        <CardBody>
          <ProfileForm
            title="Профиль"
            subtitle="Регистрация больше не нужна. Имя и аватарка нужны только для комнаты квиза."
            submitLabel="Продолжить"
            initialProfile={user}
            errors={{ name: profileError }}
            onClearError={() => setProfileError(undefined)}
            onSubmit={(profile) => {
              if (!normalizeName(profile.name)) {
                setProfileError('Введите имя');
                return;
              }
              setProfileError(undefined);
              setProfile(profile);
              router.push('/dashboard');
            }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
