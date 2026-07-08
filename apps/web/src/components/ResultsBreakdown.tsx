'use client';

import { ResultParticipantDetail, ResultQuestionSummary } from '@vkvize/shared';
import { Avatar } from './Avatar';

function AnswerCell({
  answered,
  isCorrect,
  pointsEarned,
}: {
  answered: boolean;
  isCorrect: boolean;
  pointsEarned: number;
}) {
  if (!answered) {
    return (
      <span className="vk-results-cell vk-results-cell--missed" title="Не ответил">
        —
      </span>
    );
  }

  if (isCorrect) {
    return (
      <span className="vk-results-cell vk-results-cell--correct" title={`Верно · +${pointsEarned}`}>
        ✓
      </span>
    );
  }

  return (
    <span className="vk-results-cell vk-results-cell--wrong" title={`Неверно · +${pointsEarned}`}>
      ✕
    </span>
  );
}

export function ResultsBreakdown({
  questions,
  participants,
}: {
  questions: ResultQuestionSummary[];
  participants: ResultParticipantDetail[];
}) {
  if (questions.length === 0 || participants.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[var(--vk-text-secondary)]">
        Статистика ответов пока недоступна
      </p>
    );
  }

  return (
    <div className="vk-results-breakdown">
      <div className="vk-results-breakdown-head">
        <h3 className="vk-results-breakdown-title">Статистика ответов</h3>
        <p className="vk-results-breakdown-subtitle">Кто и на какие вопросы ответил правильно</p>
      </div>

      <div className="vk-results-table-wrap">
        <table className="vk-results-table">
          <thead>
            <tr>
              <th className="vk-results-table-sticky">Участник</th>
              {questions.map((question) => (
                <th key={question.id} title={question.text}>
                  <span className="vk-results-q-index">Q{question.order}</span>
                  <span className="vk-results-q-points">{question.points} б.</span>
                </th>
              ))}
              <th className="vk-results-table-total">Итого</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => (
              <tr key={participant.participantId}>
                <td className="vk-results-table-sticky">
                  <div className="vk-results-participant">
                    <Avatar name={participant.name} avatarUrl={participant.avatarUrl} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--vk-text-primary)]">{participant.name}</p>
                      <p className="text-xs text-[var(--vk-text-secondary)]">#{participant.rank}</p>
                    </div>
                  </div>
                </td>
                {participant.answers.map((answer) => (
                  <td key={answer.questionId}>
                    <AnswerCell
                      answered={answer.answered}
                      isCorrect={answer.isCorrect}
                      pointsEarned={answer.pointsEarned}
                    />
                  </td>
                ))}
                <td className="vk-results-table-total">
                  <span className="vk-results-total-score">{participant.totalScore}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="vk-results-questions-list">
        {questions.map((question) => {
          const correctCount = participants.filter((participant) => {
            const answer = participant.answers.find((item) => item.questionId === question.id);
            return answer?.answered && answer.isCorrect;
          }).length;

          return (
            <div key={question.id} className="vk-results-question-card">
              <div className="vk-results-question-card-head">
                <span className="vk-results-question-badge">Вопрос {question.order}</span>
                <span className="vk-results-question-meta">{question.points} баллов</span>
              </div>
              <p className="vk-results-question-text">{question.text}</p>
              <p className="vk-results-question-stats">
                Верно ответили: {correctCount} из {participants.length}
              </p>
              <ul className="vk-results-question-participants">
                {participants.map((participant) => {
                  const answer = participant.answers.find((item) => item.questionId === question.id);
                  return (
                    <li key={participant.participantId} className="vk-results-question-participant">
                      <Avatar name={participant.name} avatarUrl={participant.avatarUrl} size="sm" />
                      <span className="truncate">{participant.name}</span>
                      <AnswerCell
                        answered={Boolean(answer?.answered)}
                        isCorrect={Boolean(answer?.isCorrect)}
                        pointsEarned={answer?.pointsEarned ?? 0}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
