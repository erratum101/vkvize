export function HourglassWaiting({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center py-6">
      <div className="mb-4" aria-hidden>
        <span className="vk-hourglass-icon">⏳</span>
      </div>
      <p className="text-lg font-medium">{label ?? 'Ожидание начала квиза'}</p>
      <p className="mt-2 text-sm text-[var(--vk-text-secondary)]">
        Организатор скоро запустит первый вопрос
      </p>
    </div>
  );
}
