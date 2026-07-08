'use client';

import { useEffect, useState } from 'react';
import { SessionPhase } from '@vkvize/shared';
import { uploadUrl } from '@/lib/api';
import { isMultiChoice } from '@vkvize/shared';

interface Props {
  question: {
    id: string;
    type: string;
    text: string;
    imageUrl?: string | null;
    options: { id: string; text: string; imageUrl?: string | null }[];
    correctOptionIds?: string[];
  };
  phase?: SessionPhase;
  timeLeft: number | null;
  disabled?: boolean;
  onSubmit: (selectedIds: string[]) => Promise<void>;
}

export function QuestionView({ question, phase, timeLeft, disabled, onSubmit }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const multi = isMultiChoice(question.type as never);

  useEffect(() => {
    setSelected([]);
    setSubmitted(false);
  }, [question.id]);

  const toggle = (id: string) => {
    if (submitted || disabled) return;
    if (multi) {
      setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else {
      setSelected([id]);
    }
  };

  const handleSubmit = async () => {
    if (selected.length === 0 || submitted) return;
    setSubmitted(true);
    await onSubmit(selected);
  };

  const showCorrect = phase === SessionPhase.QUESTION_RESULT;

  return (
    <div className="select-none space-y-6" onContextMenu={(e) => e.preventDefault()}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--vk-text-primary)]">{question.text}</h2>
        {timeLeft !== null && phase === SessionPhase.ANSWERING && (
          <div
            className={`text-2xl font-bold tabular-nums ${
              timeLeft <= 5 ? 'text-[var(--vk-danger)]' : 'text-[var(--vk-primary)]'
            }`}
          >
            {timeLeft}с
          </div>
        )}
      </div>

      {question.imageUrl && (
        <img
          src={uploadUrl(question.imageUrl)}
          alt=""
          draggable={false}
          className="pointer-events-none mx-auto max-h-64 rounded-[var(--vk-radius-md)] object-contain"
        />
      )}

      <div className="grid gap-3">
        {question.options.map((opt) => {
          const isSelected = selected.includes(opt.id);
          const isCorrect = showCorrect && question.correctOptionIds?.includes(opt.id);
          const isWrong = showCorrect && isSelected && !isCorrect;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              disabled={submitted || disabled || phase !== SessionPhase.ANSWERING}
              className={`w-full text-left p-4 rounded-[var(--vk-radius-md)] border-2 transition-[var(--vk-transition)] ${
                isCorrect
                  ? 'border-[var(--vk-accent)] bg-green-50'
                  : isWrong
                    ? 'border-[var(--vk-danger)] bg-red-50'
                    : isSelected
                      ? 'border-[var(--vk-primary)] bg-blue-50'
                      : 'border-[var(--vk-border)] hover:border-[var(--vk-primary)]/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {multi && (
                  <span
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected ? 'border-[var(--vk-primary)] bg-[var(--vk-primary)]' : 'border-[var(--vk-border)]'
                    }`}
                  >
                    {isSelected && <span className="text-white text-xs">✓</span>}
                  </span>
                )}
                <div>
                  {opt.imageUrl && (
                    <img
                      src={uploadUrl(opt.imageUrl)}
                      alt=""
                      draggable={false}
                      className="pointer-events-none mb-2 h-16 rounded object-cover"
                    />
                  )}
                  <span>{opt.text}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {phase === SessionPhase.ANSWERING && !submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected.length === 0}
          className="w-full py-3 bg-[var(--vk-primary)] text-white rounded-[var(--vk-radius-sm)] font-medium disabled:opacity-50"
        >
          Ответить
        </button>
      )}

      {submitted && phase === SessionPhase.ANSWERING && (
        <p className="text-center text-[var(--vk-text-secondary)]">Ответ отправлен. Ожидайте...</p>
      )}
    </div>
  );
}
