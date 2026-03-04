export interface SpacedRepetitionData {
  interval: number;       // 下次复习间隔（天）
  repetitions: number;    // 已复习次数
  easeFactor: number;     // 难度因子（默认 2.5）
  nextReviewDate: string; // ISO 日期字符串
  lastReviewDate?: string;// 上次复习日期
}

export interface KnowledgeCard {
  id: string;
  title: string;
  category: string;
  content: string;        // Markdown 内容
  tags: string[];
  createdAt: string;      // ISO 日期字符串
  updatedAt: string;
  srData: SpacedRepetitionData;
}

export interface StudySession {
  id: string;
  date: string;           // ISO 日期
  cardsReviewed: number;
  totalScore: number;
  duration: number;       // 秒
  cardResults: Array<{ cardId: string; score: number }>;
}

export interface FeynmanNote {
  id: string;
  cardId: string;
  explanation: string;      // 步骤 1 的初次解释
  answers: Array<{          // 步骤 2 的引导问题回答
    question: string;
    answer: string;
  }>;
  selfRating: number;       // 自评分 0/2/4/5
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  reminderEnabled: boolean;
  reminderTime: string;           // "HH:MM"
  reminderMode: 'daily' | 'daily+due';
  theme: 'light' | 'dark' | 'system';
  onboardingDone: boolean;
}

export interface DailyStats {
  date: string;           // YYYY-MM-DD
  studyDuration: number;  // 秒
  reviewedCount: number;
  newCardsCount: number;
}

// SM-2 评分
export type SM2Rating = 0 | 1 | 2 | 3 | 4 | 5;
