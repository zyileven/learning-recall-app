import type { SpacedRepetitionData, SM2Rating } from '../types';

/**
 * SM-2 算法实现
 * 根据用户评分（0-5）更新间隔重复数据
 */
export function applyReview(
  current: SpacedRepetitionData,
  rating: SM2Rating
): SpacedRepetitionData {
  const now = new Date();
  let { interval, repetitions, easeFactor } = current;

  if (rating < 3) {
    // 忘记了，重置
    repetitions = 0;
    interval = 1;
  } else {
    // 记住了，按 SM-2 更新
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;

    // 更新难度因子
    easeFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);
  }

  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    interval,
    repetitions,
    easeFactor,
    nextReviewDate: nextReviewDate.toISOString(),
    lastReviewDate: now.toISOString(),
  };
}

/**
 * 创建默认 SR 数据（新卡片）
 */
export function createInitialSRData(): SpacedRepetitionData {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    interval: 1,
    repetitions: 0,
    easeFactor: 2.5,
    nextReviewDate: tomorrow.toISOString(),
    lastReviewDate: undefined,
  };
}

/**
 * 判断卡片是否到期需要复习
 */
export function isDue(srData: SpacedRepetitionData): boolean {
  return new Date(srData.nextReviewDate) <= new Date();
}

/**
 * 掌握程度评估
 */
export type MasteryLevel = 'new' | 'learning' | 'mastered';

export function getMasteryLevel(srData: SpacedRepetitionData): MasteryLevel {
  if (srData.repetitions === 0) return 'new';
  if (srData.interval >= 21) return 'mastered';
  return 'learning';
}
