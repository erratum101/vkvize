'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardBody } from '@/components/Card';
import { Input } from '@/components/Input';
import { ProfileForm } from '@/components/ProfileForm';
import { LocalProfile, normalizeName } from '@/lib/local-profile';
import { attemptJoinSession, isRoomCodeJoinError, mapJoinError } from '@/lib/join-session';
import { Loader } from '@/components/Loader';

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setProfile } = useAuth();
  const [code, setCode] = useState(searchParams.get('code')?.toUpperCase() ?? '');
  const [errors, setErrors] = useState<{ code?: string; name?: string }>({});
  const [joinError, setJoinError] = useState<string>();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setJoinError(mapJoinError(decodeURIComponent(errorParam)));
    }
  }, [searchParams]);

  const join = async (profile: Omit<LocalProfile, 'id'> & { id?: string }) => {
    const nextErrors = {
      code: !code.trim() ? 'Введите код' : undefined,
      name: !normalizeName(profile.name) ? 'Введите имя' : undefined,
    };
    setErrors(nextErrors);
    setJoinError(undefined);
    if (nextErrors.code || nextErrors.name) return;

    const savedProfile = setProfile({ ...profile, name: normalizeName(profile.name) });

    try {
      await attemptJoinSession(code, savedProfile);
      router.push(`/play/${code.toUpperCase()}`);
    } catch (err) {
      const message = mapJoinError(err instanceof Error ? err.message : '');
      if (isRoomCodeJoinError(message)) {
        setErrors({ code: message });
      } else {
        setJoinError(message);
      }
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 pt-15">
      <Card>
        <CardBody className="space-y-4">
          {joinError && (
            <div className="rounded-[var(--vk-radius-sm)] border border-[var(--vk-danger)]/25 bg-red-50 px-4 py-3 text-sm text-[var(--vk-danger)]">
              {joinError}
            </div>
          )}
          <ProfileForm
            title="Профиль участника"
            subtitle="Это имя и аватар увидят остальные участники в комнате."
            submitLabel="Войти в квиз"
            submittingLabel="Подключение..."
            initialProfile={user}
            errors={{ name: errors.name }}
            onClearError={() => setErrors((prev) => ({ ...prev, name: undefined }))}
            onSubmit={join}
          >
            <div className="space-y-4 border-t border-[var(--vk-border-light)] pt-5">
              <div>
                <h3 className="text-base font-semibold text-[var(--vk-text-primary)]">Присоединиться к квизу</h3>
                <p className="mt-1 text-sm text-[var(--vk-text-secondary)]">Введите код комнаты от организатора</p>
              </div>
              <Input
                label="Код комнаты"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (errors.code) setErrors((prev) => ({ ...prev, code: undefined }));
                  if (joinError) setJoinError(undefined);
                }}
                placeholder="VK4X2Q"
                maxLength={6}
                error={errors.code}
              />
            </div>
          </ProfileForm>
        </CardBody>
      </Card>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader label="Загрузка..." /></div>}>
      <JoinForm />
    </Suspense>
  );
}
