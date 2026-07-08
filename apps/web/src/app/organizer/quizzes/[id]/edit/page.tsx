'use client';

import { useEffect, useId, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, QuizDetail, Question, QuestionInput, uploadUrl } from '@/lib/api';
import { Button } from '@/components/Button';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { FileInput } from '@/components/FileInput';
import { ProfileForm } from '@/components/ProfileForm';
import { Loader } from '@/components/Loader';
import { QuestionType, isImageQuestion } from '@vkvize/shared';
import { normalizeName } from '@/lib/local-profile';

const QUESTION_TYPES: { value: QuestionType; label: string; short: string }[] = [
  { value: QuestionType.TEXT_SINGLE, label: 'Текст — один ответ', short: 'Текст · один' },
  { value: QuestionType.TEXT_MULTI, label: 'Текст — несколько ответов', short: 'Текст · неск.' },
  { value: QuestionType.IMAGE_SINGLE, label: 'Изображение — один ответ', short: 'Фото · один' },
  { value: QuestionType.IMAGE_MULTI, label: 'Изображение — несколько ответов', short: 'Фото · неск.' },
];

const TYPE_ACCENT: Record<QuestionType, string> = {
  [QuestionType.TEXT_SINGLE]: '#0077ff',
  [QuestionType.TEXT_MULTI]: '#7c3aed',
  [QuestionType.IMAGE_SINGLE]: '#e421d3',
  [QuestionType.IMAGE_MULTI]: '#00b8d9',
};

// Kahoot-style answer palette, mapped to the site's own tokens so it stays on-brand.
const OPTION_STYLES: { bg: string; shape: 'triangle' | 'diamond' | 'circle' | 'square' | 'star' | 'hex' }[] = [
  { bg: '#e64646', shape: 'triangle' },
  { bg: '#0077ff', shape: 'diamond' },
  { bg: '#ffa000', shape: 'circle' },
  { bg: '#00b8d9', shape: 'square' },
  { bg: '#7c3aed', shape: 'star' },
  { bg: '#e421d3', shape: 'hex' },
];

const EXAMPLE_QUESTIONS = [
  'Столица Франции?',
  'Сколько стоит шмот?',
  'Кто такой Врангель?',
  'Можно ли дышать угарным газом?',
  'Сколько будет дважды два?',
  'Кто написал «Войну и мир»?',
  'Какая планета ближе всего к Солнцу?',
  'Сколько костей у жирафа в шее?',
  'Кто сильнее: лев или тигр?',
  'В каком году началась Вторая мировая война?',
  'Сколько будет 7 умножить на 8?',
  'Кто автор картины «Чёрный квадрат»?',
  'Видно ли Великую Китайскую стену из космоса?',
  'Сколько ног у паука?',
  'Чей Крым?',
  'Сколько букв в русском алфавите?',
  'Кто первым полетел в космос?',
  'Какая самая длинная река в мире?',
  'Сколько щупалец у осьминога?',
  'Кто написал «Гарри Поттера»?',
  'Правда, что Земля круглая?',
  'Сколько цветов у радуги?',
  'Кто изобрёл лампочку?',
  'Сколько дней в високосном году?',
  'Что тяжелее: килограмм пуха или килограмм железа?',
];

function useTypewriter(words: string[], active: boolean) {
  const [text, setText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!active) return;

    const current = words[wordIndex % words.length];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && text === current) {
      timeout = setTimeout(() => setDeleting(true), 900);
    } else if (deleting && text === '') {
      timeout = setTimeout(() => {
        setDeleting(false);
        setWordIndex((i) => (i + 1) % words.length);
      }, 150);
    } else {
      timeout = setTimeout(
        () => setText(current.slice(0, deleting ? text.length - 1 : text.length + 1)),
        deleting ? 14 : 28,
      );
    }

    return () => clearTimeout(timeout);
  }, [text, deleting, wordIndex, words, active]);

  return text;
}

const OPTION_TEXT_FONT = "600 15px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
let measureCanvasCtx: CanvasRenderingContext2D | null | undefined;

function measureTextWidth(text: string, font: string) {
  if (typeof document === 'undefined') return 0;
  if (measureCanvasCtx === undefined) {
    measureCanvasCtx = document.createElement('canvas').getContext('2d');
  }
  if (!measureCanvasCtx) return 0;
  measureCanvasCtx.font = font;
  return measureCanvasCtx.measureText(text).width;
}

function pluralize(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function QuestionTypeIcon({ type, className = 'h-8 w-8' }: { type: QuestionType; className?: string }) {
  if (type === QuestionType.TEXT_SINGLE) {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
        <path d="M9 7.5H20L24 11.5V24.5H9V7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M20 7.5V11.5H24" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M13 15H20M13 18.5H18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M14 23L16 25L20 20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === QuestionType.TEXT_MULTI) {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
        <path d="M9 7.5H23V24.5H9V7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M13 13H20M13 17H20M13 21H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8 13L6.8 11.8M8 17L6.8 15.8M8 21L6.8 19.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === QuestionType.IMAGE_SINGLE) {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
        <path d="M7.5 9H24.5V22.5H7.5V9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M10.5 20L14 16.5L17 19.5L19 17.5L22.5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20.5 13.5H20.52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M13 25L15 27L19 22.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path d="M9 8.5H23V20.5H9V8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M6 12.5V23.5H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.5 18L14.5 15L17 17.5L18.5 16L21.5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 25L19.5 26.5L22.5 23M23.5 25L25 26.5L28 23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OptionShapeIcon({ shape }: { shape: (typeof OPTION_STYLES)[number]['shape'] }) {
  const cls = 'h-4 w-4 fill-white';
  switch (shape) {
    case 'triangle':
      return (
        <svg viewBox="0 0 20 20" className={cls} aria-hidden="true">
          <path d="M10 3L18.5 17H1.5L10 3Z" />
        </svg>
      );
    case 'diamond':
      return (
        <svg viewBox="0 0 20 20" className={cls} aria-hidden="true">
          <path d="M10 2L18 10L10 18L2 10Z" />
        </svg>
      );
    case 'circle':
      return (
        <svg viewBox="0 0 20 20" className={cls} aria-hidden="true">
          <circle cx="10" cy="10" r="7.5" />
        </svg>
      );
    case 'square':
      return (
        <svg viewBox="0 0 20 20" className={cls} aria-hidden="true">
          <rect x="3" y="3" width="14" height="14" rx="2.5" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 20 20" className={cls} aria-hidden="true">
          <path d="M10 1.5L12.5 7.3L19 8L14.2 12.3L15.5 18.5L10 15.3L4.5 18.5L5.8 12.3L1 8L7.5 7.3L10 1.5Z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" className={cls} aria-hidden="true">
          <path d="M6.2 2.5H13.8L18 10L13.8 17.5H6.2L2 10L6.2 2.5Z" />
        </svg>
      );
  }
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M2.5 7.2L5.5 10.2L11.5 3.8" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M3 7.2C3 6.5 3.6 6 4.3 6H6L7 4.5H13L14 6H15.7C16.4 6 17 6.5 17 7.2V14.8C17 15.5 16.4 16 15.7 16H4.3C3.6 16 3 15.5 3 14.8V7.2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="10" cy="11" r="2.6" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
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

function EditIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M13.4 3.6L16.4 6.6L6.9 16.1H3.9V13.1L13.4 3.6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M11.4 5.6L14.4 8.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TileImageButton({ onFile, hasImage }: { onFile: (file: File) => void; hasImage: boolean }) {
  const id = useId();
  return (
    <>
      <label
        htmlFor={id}
        title={hasImage ? 'Заменить изображение' : 'Добавить изображение'}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-white/20 transition-[var(--vk-transition)] hover:bg-white/30"
      >
        <CameraIcon />
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </>
  );
}

const emptyQuestion = (): QuestionInput => ({
  type: QuestionType.TEXT_SINGLE,
  text: '',
  timeLimitSec: 30,
  points: 100,
  options: [
    { text: 'Вариант 1', isCorrect: true },
    { text: 'Вариант 2', isCorrect: false },
  ],
});

export default function QuizEditPage() {
  const params = useParams();
  const quizId = params.id as string;
  const router = useRouter();
  const { user, loading, setProfile } = useAuth();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [selectedQ, setSelectedQ] = useState<Question | null>(null);
  const [form, setForm] = useState<QuestionInput>(emptyQuestion());
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{ text?: string; options?: string }>({});
  const [profileError, setProfileError] = useState<string>();
  const placeholderText = useTypewriter(EXAMPLE_QUESTIONS, !form.text);

  const load = () => api.quizzes.get(quizId).then(setQuiz).catch(console.error);

  useEffect(() => {
    if (quizId && user) {
      load();
      api.categories().then(setCategories).catch(console.error);
    }
  }, [quizId, user]);

  const selectQuestion = (q: Question) => {
    setSelectedQ(q);
    setForm({
      type: q.type,
      text: q.text,
      imageUrl: q.imageUrl,
      timeLimitSec: q.timeLimitSec,
      points: q.points,
      categoryId: q.categoryId,
      options: q.options.map((o) => ({
        text: o.text,
        imageUrl: o.imageUrl,
        isCorrect: o.isCorrect,
        order: o.order,
      })),
    });
    setFieldErrors({});
  };

  const newQuestion = () => {
    setSelectedQ(null);
    setForm(emptyQuestion());
    setFieldErrors({});
  };

  const saveQuestion = async () => {
    const errors: { text?: string; options?: string } = {};

    if (!form.text.trim()) {
      errors.text = 'Введите текст';
    }

    if (form.options.length < 2) {
      errors.options = 'Добавьте минимум два варианта ответа';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSaving(true);
    try {
      if (selectedQ) {
        await api.quizzes.updateQuestion(quizId, selectedQ.id, form);
      } else {
        await api.quizzes.addQuestion(quizId, form);
      }
      await load();
      newQuestion();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Удалить вопрос?')) return;
    await api.quizzes.deleteQuestion(quizId, id);
    await load();
    if (selectedQ?.id === id) newQuestion();
  };

  const startSession = async () => {
    if (!quiz) return;

    if (quiz.questions.length < 2) {
      alert('Квиз должен состоять минимум из двух вопросов');
      return;
    }

    setStarting(true);
    try {
      const session = await api.quizzes.createSession(quizId);
      router.push(`/organizer/session/${session.roomCode}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка запуска');
    } finally {
      setStarting(false);
    }
  };

  const uploadImage = async (file: File, field: 'question' | number) => {
    const { url } = await api.upload(file);
    if (field === 'question') {
      setForm({ ...form, imageUrl: url });
    } else {
      const options = [...form.options];
      options[field] = { ...options[field], imageUrl: url };
      setForm({ ...form, options });
    }
  };

  const toggleCorrect = (i: number, multi: boolean) => {
    const options = form.options.map((o, j) =>
      multi ? (j === i ? { ...o, isCorrect: !o.isCorrect } : o) : { ...o, isCorrect: j === i },
    );
    setForm({ ...form, options });
  };

  const removeOption = (i: number) => {
    setForm({ ...form, options: form.options.filter((_, j) => j !== i) });
  };

  const addOption = () => {
    setForm({
      ...form,
      options: [...form.options, { text: `Вариант ${form.options.length + 1}`, isCorrect: false }],
    });
    if (fieldErrors.options) setFieldErrors((errors) => ({ ...errors, options: undefined }));
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader label="Загрузка..." /></div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 pt-15">
        <Card>
          <CardBody>
            <ProfileForm
              title="Профиль организатора"
              subtitle="Чтобы редактировать и запускать квиз, укажите имя и аватарку."
              submitLabel="Открыть квиз"
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

  if (!quiz) return <div className="flex min-h-screen items-center justify-center"><Loader label="Загрузка..." /></div>;

  const showImage = isImageQuestion(form.type as QuestionType);
  const isMulti = form.type === QuestionType.TEXT_MULTI || form.type === QuestionType.IMAGE_MULTI;

  return (
    <div className="mx-auto max-w-6xl px-3 pb-10 pt-20 sm:px-4 sm:pt-24">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--vk-text-secondary)]">
            Редактирование квиза
          </p>
          <h1 className="mt-1 truncate text-xl font-bold text-[var(--vk-text-primary)] sm:text-2xl">{quiz.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-[var(--vk-text-secondary)]">
            <span>
              {quiz.questions.length} {pluralize(quiz.questions.length, 'вопрос', 'вопроса', 'вопросов')}
            </span>
            {quiz.questions.length < 2 && (
              <span className="inline-flex items-center gap-1 text-[var(--vk-danger)]">
                · нужно минимум два для запуска
              </span>
            )}
          </div>
        </div>
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={startSession}
          disabled={starting || quiz.questions.length < 2}
        >
          {starting ? 'Запуск...' : 'Запустить квиз'}
        </Button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="flex flex-col self-start">
          <CardHeader title="Вопросы" />
          <CardBody className="space-y-1.5">
            <Button variant="secondary" size="sm" className="mb-2 w-full" onClick={newQuestion}>
              + Добавить вопрос
            </Button>
            {quiz.questions.map((q, i) => {
              const active = selectedQ?.id === q.id;
              return (
                <div
                  key={q.id}
                  className={`group flex cursor-pointer select-none items-center gap-2.5 rounded-r-[var(--vk-radius-sm)] border-l-[3px] py-2.5 pl-3 pr-2 transition-[var(--vk-transition)] ${
                    active ? 'border-l-[var(--vk-primary)] bg-[var(--vk-primary)]/[0.07]' : 'border-l-transparent hover:bg-[var(--vk-bg-hover)]'
                  }`}
                  onClick={() => selectQuestion(q)}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--vk-bg-hover)] text-xs font-semibold text-[var(--vk-text-secondary)]">
                    {i + 1}
                  </span>
                  <span className="shrink-0" style={{ color: TYPE_ACCENT[q.type as QuestionType] }}>
                    <QuestionTypeIcon type={q.type as QuestionType} className="h-4 w-4" />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--vk-text-primary)]">
                    {q.text || 'Без текста'}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteQuestion(q.id);
                    }}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs text-[var(--vk-text-secondary)] opacity-0 transition-[var(--vk-transition)] hover:bg-[var(--vk-danger)]/10 hover:text-[var(--vk-danger)] group-hover:opacity-100"
                    aria-label="Удалить вопрос"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card className="flex flex-col self-start">
          <CardHeader title={selectedQ ? 'Редактирование вопроса' : 'Новый вопрос'} />
          <CardBody className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--vk-text-primary)]">Тип вопроса</label>
              <div
                className="flex w-full flex-wrap gap-1 rounded-2xl bg-[var(--vk-bg-secondary)] p-1"
                role="radiogroup"
                aria-label="Тип вопроса"
              >
                {QUESTION_TYPES.map((type) => {
                  const active = form.type === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={type.label}
                      onClick={() => setForm({ ...form, type: type.value })}
                      className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-2.5 py-2 text-xs font-medium transition-[var(--vk-transition)] sm:flex-initial sm:rounded-full sm:px-3.5 sm:text-sm ${
                        active
                          ? 'bg-white text-[var(--vk-text-primary)] shadow-[var(--vk-shadow-sm)]'
                          : 'text-[var(--vk-text-secondary)] hover:text-[var(--vk-text-primary)]'
                      }`}
                    >
                      <span style={{ color: active ? TYPE_ACCENT[type.value] : 'currentColor' }}>
                        <QuestionTypeIcon type={type.value} className="h-4 w-4 shrink-0" />
                      </span>
                      {type.short}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--vk-text-primary)]">Текст вопроса</label>
              <div className="relative">
                <input
                  type="text"
                  value={form.text}
                  onChange={(e) => {
                    setForm({ ...form, text: e.target.value });
                    if (fieldErrors.text) setFieldErrors((errors) => ({ ...errors, text: undefined }));
                  }}
                  aria-invalid={fieldErrors.text ? true : undefined}
                  aria-label="Текст вопроса"
                  className={`w-full rounded-[var(--vk-radius-md)] border bg-white px-4 py-3.5 text-lg font-semibold text-[var(--vk-text-primary)] transition-[var(--vk-transition)] focus:outline-none ${
                    fieldErrors.text
                      ? 'border-[var(--vk-danger)] focus:border-[var(--vk-danger)] focus:ring-2 focus:ring-[var(--vk-danger)]/15'
                      : 'border-[var(--vk-border)] focus:border-[var(--vk-primary)] focus:ring-2 focus:ring-[var(--vk-primary)]/20'
                  }`}
                />
                {!form.text && (
                  <div className="pointer-events-none absolute inset-0 flex items-center px-4 text-base font-normal text-[var(--vk-text-secondary)]">
                    <span className="truncate">{placeholderText}</span>
                    <span className="ml-0.5 inline-block h-[1.2em] w-[2px] shrink-0 animate-pulse bg-[var(--vk-text-secondary)]/60" />
                  </div>
                )}
                {fieldErrors.text && (
                  <span
                    className="pointer-events-none absolute inset-y-0 right-4 flex max-w-[60%] items-center justify-end text-right text-xs leading-tight text-[var(--vk-danger)]"
                    aria-live="polite"
                  >
                    <span className="whitespace-nowrap">{fieldErrors.text}</span>
                  </span>
                )}
              </div>
            </div>

            {showImage && (
              <div className="space-y-3 rounded-[var(--vk-radius-md)] border border-[var(--vk-border-light)] bg-[var(--vk-bg-secondary)] p-4">
                {form.imageUrl && (
                  <img
                    src={uploadUrl(form.imageUrl)}
                    alt=""
                    draggable={false}
                    className="pointer-events-none h-32 w-full rounded-[var(--vk-radius-sm)] object-cover"
                  />
                )}
                <FileInput label="Изображение вопроса" onFile={(file) => uploadImage(file, 'question')} />
              </div>
            )}

            <div className={`grid grid-cols-2 gap-4 ${categories.length > 0 ? 'sm:grid-cols-3' : ''}`}>
              <Input
                label="Время (сек)"
                type="number"
                value={form.timeLimitSec}
                onChange={(e) => setForm({ ...form, timeLimitSec: +e.target.value })}
              />
              <Input
                label="Баллы"
                type="number"
                value={form.points}
                onChange={(e) => setForm({ ...form, points: +e.target.value })}
              />
              {categories.length > 0 && (
                <Select
                  label="Категория"
                  className="col-span-2 sm:col-span-1"
                  value={form.categoryId || ''}
                  onChange={(categoryId) => setForm({ ...form, categoryId: categoryId || null })}
                  options={[{ value: '', label: '—' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-[var(--vk-text-primary)]">Варианты ответа</label>
                <span
                  className={`text-xs ${fieldErrors.options ? 'text-[var(--vk-danger)]' : 'text-[var(--vk-text-secondary)]'}`}
                  aria-live="polite"
                >
                  {fieldErrors.options || (isMulti ? 'Отметьте все верные ответы' : 'Отметьте верный ответ')}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {form.options.map((opt, i) => {
                  const style = OPTION_STYLES[i % OPTION_STYLES.length];
                  return (
                    <div
                      key={i}
                      role="button"
                      tabIndex={0}
                      aria-pressed={opt.isCorrect}
                      onClick={() => toggleCorrect(i, isMulti)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleCorrect(i, isMulti);
                        }
                      }}
                      className="group relative flex min-h-[112px] cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border-[3px] p-3.5 shadow-[var(--vk-shadow-sm)] transition-[var(--vk-transition)] hover:-translate-y-0.5 hover:shadow-[var(--vk-shadow-md)]"
                      style={{
                        background: style.bg,
                        borderColor: opt.isCorrect ? 'var(--vk-accent)' : 'transparent',
                      }}
                    >
                      {opt.imageUrl && (
                        <>
                          <img
                            src={uploadUrl(opt.imageUrl)}
                            alt=""
                            draggable={false}
                            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                          />
                          <div className="absolute inset-0" style={{ background: `${style.bg}b3` }} />
                        </>
                      )}

                      <div className="relative z-10 flex items-center justify-between gap-1">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20">
                          <OptionShapeIcon shape={style.shape} />
                        </span>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {showImage && (
                            <TileImageButton hasImage={!!opt.imageUrl} onFile={(file) => uploadImage(file, i)} />
                          )}
                          {form.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(i)}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/0 transition-[var(--vk-transition)] hover:bg-black/15 hover:text-white group-hover:text-white/80"
                              aria-label="Удалить вариант"
                            >
                              <TrashIcon />
                            </button>
                          )}
                          <span
                            aria-hidden="true"
                            title="Правильный ответ"
                            style={opt.isCorrect ? { background: 'var(--vk-accent)' } : undefined}
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-[var(--vk-transition)] ${
                              opt.isCorrect ? 'border-transparent' : 'border-white/55 bg-transparent'
                            }`}
                          >
                            {opt.isCorrect && <CheckIcon color="#fff" />}
                          </span>
                        </div>
                      </div>

                      <div
                        className="relative z-10 mt-2 flex max-w-full items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          value={opt.text}
                          onChange={(e) => {
                            const options = [...form.options];
                            options[i] = { ...options[i], text: e.target.value };
                            setForm({ ...form, options });
                          }}
                          placeholder={`Вариант ${i + 1}`}
                          style={{
                            width: `${measureTextWidth(opt.text || `Вариант ${i + 1}`, OPTION_TEXT_FONT) + 2}px`,
                          }}
                          className="max-w-full min-w-[1ch] shrink select-text border-none bg-transparent p-0 text-[15px] font-semibold text-white placeholder:font-normal placeholder:text-white/70 focus:outline-none"
                        />
                        <EditIcon className="h-3.5 w-3.5 shrink-0 text-white/60" />
                      </div>
                    </div>
                  );
                })}

                {form.options.length < OPTION_STYLES.length && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="flex min-h-[112px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-[var(--vk-border)] text-[var(--vk-text-secondary)] transition-[var(--vk-transition)] hover:border-[var(--vk-primary)]/50 hover:bg-[var(--vk-primary)]/5 hover:text-[var(--vk-primary)]"
                  >
                    <PlusIcon />
                    <span className="text-sm font-medium">Добавить вариант</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex border-t border-[var(--vk-border-light)] pt-5 sm:justify-end">
              <Button className="w-full sm:w-auto" onClick={saveQuestion} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить вопрос'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
