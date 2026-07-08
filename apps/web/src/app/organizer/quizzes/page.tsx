'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, Quiz } from '@/lib/api';
import { Button } from '@/components/Button';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Input } from '@/components/Input';
import { ProfileForm } from '@/components/ProfileForm';
import { Loader } from '@/components/Loader';
import Link from 'next/link';
import { normalizeName } from '@/lib/local-profile';

function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M4.5 13.8V16H6.7L14.2 8.5L12 6.3L4.5 13.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M11.3 7L12.8 5.5C13.4 4.9 14.4 4.9 15 5.5C15.6 6.1 15.6 7.1 15 7.7L13.5 9.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M7.5 4.5H12.5M4.5 6.5H15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M6 6.5L6.7 15.2C6.78 16.2 7.62 17 8.62 17H11.38C12.38 17 13.22 16.2 13.3 15.2L14 6.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 9V14M11.5 9V14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function OrganizerQuizzesPage() {
  const { user, loading, setProfile } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingQuizId, setDeletingQuizId] = useState<string>();
  const [titleError, setTitleError] = useState<string>();
  const [profileError, setProfileError] = useState<string>();

  useEffect(() => {
    if (user) api.quizzes.list().then(setQuizzes).catch(console.error);
  }, [user]);

  const createQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError('Введите название');
      return;
    }
    setTitleError(undefined);
    setCreating(true);
    try {
      const quiz = await api.quizzes.create({ title });
      router.push(`/organizer/quizzes/${quiz.id}/edit`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setCreating(false);
    }
  };

  const deleteQuiz = async (quiz: Quiz) => {
    if (!confirm(`Удалить квиз «${quiz.title}»?`)) return;

    setDeletingQuizId(quiz.id);
    try {
      await api.quizzes.delete(quiz.id);
      setQuizzes((items) => items.filter((item) => item.id !== quiz.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setDeletingQuizId(undefined);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader label="Загрузка..." /></div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 pt-15">
        <Card>
          <CardBody>
            <ProfileForm
              title="Профиль организатора"
              subtitle="Введите имя и выберите аватарку. Это будет видно участникам в комнате квиза."
              submitLabel="Продолжить к созданию"
              errors={{ name: profileError }}
              onClearError={() => setProfileError(undefined)}
              onSubmit={(profile) => {
                if (!normalizeName(profile.name)) {
                  setProfileError('Введите имя');
                  return;
                }
                setProfileError(undefined);
                setProfile(profile);
              }}
            />
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 pb-8 pt-24">
      <h1 className="text-2xl font-bold">Мои квизы</h1>

      <Card>
        <CardHeader title="Создать новый квиз" />
        <CardBody>
          <form onSubmit={createQuiz} className="flex gap-3">
            <Input
              placeholder="Название квиза"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(undefined);
              }}
              error={titleError}
              className="flex-1"
            />
            <Button type="submit" disabled={creating}>
              Создать
            </Button>
          </form>
        </CardBody>
      </Card>

      <div className="space-y-3">
        {quizzes.map((q) => (
          <Card key={q.id}>
            <CardBody className="flex justify-between items-center">
              <div>
                <Link href={`/organizer/quizzes/${q.id}/edit`} className="font-semibold text-[var(--vk-primary)] hover:underline">
                  {q.title}
                </Link>
                <p className="text-sm text-[var(--vk-text-secondary)]">
                  {q._count?.questions ?? 0} вопросов · {q.status}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/organizer/quizzes/${q.id}/edit`}
                  className="group inline-flex h-9 items-center justify-center overflow-hidden rounded-[var(--vk-radius-sm)] px-2.5 text-[var(--vk-text-primary)] transition-[var(--vk-transition)] hover:bg-[var(--vk-bg-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--vk-primary)]/20"
                  aria-label={`Редактировать квиз ${q.title}`}
                >
                  <EditIcon />
                  <span className="max-w-0 whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-200 ease-out group-hover:ml-2 group-hover:max-w-28 group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-28 group-focus-visible:opacity-100">
                    Редактировать
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => deleteQuiz(q)}
                  disabled={deletingQuizId === q.id}
                  className="group inline-flex h-9 items-center justify-center overflow-hidden rounded-[var(--vk-radius-sm)] px-2.5 text-[var(--vk-danger)] transition-[var(--vk-transition)] hover:bg-[var(--vk-danger)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--vk-danger)]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Удалить квиз ${q.title}`}
                >
                  <TrashIcon />
                  <span className="max-w-0 whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-200 ease-out group-hover:ml-2 group-hover:max-w-20 group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-20 group-focus-visible:opacity-100">
                    Удалить?
                  </span>
                </button>
              </div>
            </CardBody>
          </Card>
        ))}
        {quizzes.length === 0 && (
          <p className="text-center text-[var(--vk-text-secondary)] py-8">Квизов пока нет</p>
        )}
      </div>
    </div>
  );
}
