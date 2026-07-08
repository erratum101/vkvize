import {
  QuestionType,
  QuizSettings,
  DEFAULT_QUIZ_SETTINGS,
  isMultiChoice,
} from '@vkvize/shared';

interface AnswerOptionInput {
  id: string;
  isCorrect: boolean;
}

export function calculateScore(
  questionType: QuestionType,
  options: AnswerOptionInput[],
  selectedOptionIds: string[],
  maxPoints: number,
  settings: QuizSettings = DEFAULT_QUIZ_SETTINGS
): { isCorrect: boolean; pointsEarned: number } {
  const correctIds = options.filter((o) => o.isCorrect).map((o) => o.id);
  const selected = new Set(selectedOptionIds);

  if (!isMultiChoice(questionType)) {
    const isCorrect = selected.size === 1 && correctIds.length === 1 && selected.has(correctIds[0]);
    return { isCorrect, pointsEarned: isCorrect ? maxPoints : 0 };
  }

  const correctSelected = correctIds.filter((id) => selected.has(id)).length;
  const wrongSelected = [...selected].filter((id) => !correctIds.includes(id)).length;

  if (settings.multiChoiceScoring === 'all_or_nothing') {
    const isCorrect =
      wrongSelected === 0 &&
      correctSelected === correctIds.length &&
      selected.size === correctIds.length;
    return { isCorrect, pointsEarned: isCorrect ? maxPoints : 0 };
  }

  if (wrongSelected > 0 || correctIds.length === 0) {
    return { isCorrect: false, pointsEarned: 0 };
  }

  const ratio = correctSelected / correctIds.length;
  const isCorrect = ratio === 1 && selected.size === correctIds.length;
  const pointsEarned = Math.round(maxPoints * ratio);
  return { isCorrect, pointsEarned };
}

export function buildLeaderboard(
  participants: { id: string; name: string; avatarUrl?: string | null; totalScore: number }[]
) {
  const sorted = [...participants].sort((a, b) => b.totalScore - a.totalScore);
  return sorted.map((p, index) => ({
    participantId: p.id,
    name: p.name,
    avatarUrl: p.avatarUrl,
    totalScore: p.totalScore,
    rank: index + 1,
  }));
}
