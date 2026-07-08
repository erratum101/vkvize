import { Button } from '@/components/Button';
import { Card, CardBody } from '@/components/Card';
import Image from 'next/image';

const featureCards = [
  {
    title: 'Для организаторов',
    label: 'Конструктор',
    image: '/design/vk-illustration-organizer.png',
    desc: 'Конструктор вопросов с текстом и изображениями, таймерами, категориями и правилами начисления баллов.',
  },
  {
    title: 'Real-time',
    label: 'Live mode',
    image: '/design/vk-illustration-realtime.png',
    desc: 'Вопросы синхронно появляются у всех участников, а сервер контролирует дедлайн и приём ответов.',
  },
  {
    title: 'Лидерборд',
    label: 'Winners',
    image: '/design/vk-illustration-leaderboard.png',
    desc: 'После квиза участники видят яркий рейтинг, топ-3 победителей и сохранённую историю результата.',
  },
];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[var(--vk-bg-page)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,119,255,0.24),rgba(228,33,211,0.14)_42%,transparent_70%)] blur-3xl" />

      <section className="relative isolate min-h-screen overflow-hidden bg-[var(--vk-bg-page)]">
        <Image
          src="/design/vk-quiz-hero-background-glass-glow-white.png?v=4"
          alt="Абстрактная иллюстрация V Kvize"
          width={960}
          height={540}
          priority
          unoptimized
          className="pointer-events-none absolute -z-20 right-[clamp(-6%,2vw,8%)] top-1/2 h-auto w-[clamp(280px,58vw,860px)] -translate-y-1/2 object-contain opacity-95 mix-blend-multiply"
        />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_58%_44%,rgba(228,33,211,0.1),transparent_34%),linear-gradient(90deg,rgba(237,238,240,0.98)_0%,rgba(245,246,248,0.9)_28%,rgba(245,246,248,0.5)_55%,rgba(245,246,248,0.08)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-[var(--vk-bg-page)] via-[var(--vk-bg-page)]/70 to-transparent" />
        <div className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full bg-[var(--vk-primary)]/20 blur-3xl" />
        <div className="pointer-events-none absolute right-24 top-12 h-56 w-56 rounded-full bg-fuchsia-400/15 blur-3xl" />

        <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 pb-20 pt-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/64 px-4 py-2 text-sm font-medium text-[var(--vk-primary)] shadow-[var(--vk-shadow-sm)] backdrop-blur-xl">
            <span className="h-2 w-2 rounded-2xl bg-[var(--vk-accent)] shadow-[0_0_18px_rgba(75,179,75,0.9)]" />
              без регистрации · realtime · V Kvize
            </div>
            <h1 className="mb-6 max-w-2xl text-[clamp(2.25rem,4.5vw+1rem,4.5rem)] font-black italic uppercase leading-[0.95] tracking-[-0.05em] text-[var(--vk-text-primary)]">
              Квизы в реальном времени
            </h1>
            <p className="mb-10 max-w-xl text-[clamp(1rem,0.4vw+0.9rem,1.125rem)] leading-8 text-[var(--vk-text-secondary)]">
              Создавайте интерактивные опросы, подключайте участников по коду комнаты и показывайте
              результаты в эффектном лидерборде. Без регистрации: имя, аватарка и сразу в игру.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                href="/organizer/quizzes"
                className="min-w-56 !rounded-2xl bg-[var(--vk-primary)] px-8 py-4 text-white shadow-[0_18px_44px_rgba(0,119,255,0.28)] hover:bg-[var(--vk-primary-hover)]"
              >
                Создать квиз
              </Button>
              <Button
                size="lg"
                variant="secondary"
                href="/join"
                className="min-w-48 !rounded-2xl border border-white/70 bg-white/72 px-8 py-4 text-[var(--vk-text-primary)]/80 backdrop-blur-xl hover:bg-white/90 hover:text-[var(--vk-text-primary)]"
              >
                Присоединиться
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-[var(--vk-text-primary)]">Яркие сценарии для квиза</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {featureCards.map((item) => (
            <Card
              key={item.title}
              className="group flex h-full !rounded-[28px] flex-col overflow-hidden border-white/70 bg-white/75 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(0,35,90,0.16)]"
            >
              <CardBody className="relative flex flex-1 flex-col !p-4">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(0,119,255,0.2),rgba(228,33,211,0.16),transparent_70%)] blur-2xl" />
                <div className="relative mb-4 flex h-44 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,rgba(0,119,255,0.08),rgba(228,33,211,0.08))]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={520}
                    height={390}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(255,255,255,0.45)_100%)]" />
                </div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--vk-primary)]">
                  {item.label}
                </p>
                <h3 className="mb-2 text-xl font-black text-[var(--vk-text-primary)]">{item.title}</h3>
                <p className="flex-1 text-sm leading-6 text-[var(--vk-text-secondary)]">{item.desc}</p>
                <div className="mt-4 h-1.5 rounded-full bg-[linear-gradient(90deg,var(--vk-primary),#21d4fd,#e421d3)] opacity-80" />
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,rgba(0,119,255,0.94),rgba(76,55,220,0.9),rgba(228,33,211,0.88))] p-8 text-white shadow-[0_30px_90px_rgba(0,35,120,0.25)] md:p-10">
          <div className="pointer-events-none absolute -left-16 top-8 h-48 w-48 rounded-full bg-cyan-300/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-fuchsia-300/20 blur-3xl" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] opacity-80">V Kvize</p>
              <h2 className="mt-3 text-3xl font-black md:text-4xl">Запуск комнаты выглядит как мини-шоу</h2>
              <p className="mt-4 max-w-2xl leading-7 opacity-85">
                Организатор показывает код и QR, участники входят как гости или через аккаунт, а каждый
                вопрос появляется только на время демонстрации.
              </p>
            </div>

            <div className="relative min-h-[220px] overflow-hidden rounded-3xl border border-white/35 bg-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-xl">
              <Image
                src="/design/vk-quiz-hero-background.png"
                alt="Иллюстрация интерфейса V Kvize"
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
