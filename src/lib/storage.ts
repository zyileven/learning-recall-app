import type { KnowledgeCard, UserSettings, StudySession, FeynmanNote, DailyStats } from '../types';

const KEYS = {
  CARDS: 'lr_cards',
  CATEGORIES: 'lr_categories',
  SESSIONS: 'lr_sessions',
  FEYNMAN_NOTES: 'lr_feynman_notes',
  SETTINGS: 'lr_settings',
  STATS: 'lr_stats',
} as const;

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Cards ─────────────────────────────────────────────────────────────────

export function getCards(): KnowledgeCard[] {
  return get<KnowledgeCard[]>(KEYS.CARDS, []);
}

export function getCard(id: string): KnowledgeCard | undefined {
  return getCards().find((c) => c.id === id);
}

export function saveCard(card: KnowledgeCard): void {
  const cards = getCards();
  const idx = cards.findIndex((c) => c.id === card.id);
  if (idx >= 0) {
    cards[idx] = card;
  } else {
    cards.push(card);
  }
  set(KEYS.CARDS, cards);

  // Auto-update categories
  const cats = getCategories();
  if (card.category && !cats.includes(card.category)) {
    cats.push(card.category);
    set(KEYS.CATEGORIES, cats);
  }
}

export function deleteCard(id: string): void {
  const cards = getCards().filter((c) => c.id !== id);
  set(KEYS.CARDS, cards);
}

// ─── Categories ────────────────────────────────────────────────────────────

export function getCategories(): string[] {
  return get<string[]>(KEYS.CATEGORIES, []);
}

export function saveCategories(categories: string[]): void {
  set(KEYS.CATEGORIES, categories);
}

// ─── Settings ──────────────────────────────────────────────────────────────

const defaultSettings: UserSettings = {
  reminderEnabled: false,
  reminderTime: '09:00',
  theme: 'system',
  reminderFrequency: 'daily',
};

export function getSettings(): UserSettings {
  return get<UserSettings>(KEYS.SETTINGS, defaultSettings);
}

export function saveSettings(settings: UserSettings): void {
  set(KEYS.SETTINGS, settings);
}

// ─── Sessions ──────────────────────────────────────────────────────────────

export function getSessions(): StudySession[] {
  return get<StudySession[]>(KEYS.SESSIONS, []);
}

export function saveSession(session: StudySession): void {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  set(KEYS.SESSIONS, sessions);
}

// ─── Feynman Notes ─────────────────────────────────────────────────────────

export function getFeynmanNotes(): FeynmanNote[] {
  return get<FeynmanNote[]>(KEYS.FEYNMAN_NOTES, []);
}

export function saveFeynmanNote(note: FeynmanNote): void {
  const notes = getFeynmanNotes();
  const idx = notes.findIndex((n) => n.id === note.id);
  if (idx >= 0) {
    notes[idx] = note;
  } else {
    notes.push(note);
  }
  set(KEYS.FEYNMAN_NOTES, notes);
}

// ─── Daily Stats ───────────────────────────────────────────────────────────

export function getDailyStats(): DailyStats[] {
  return get<DailyStats[]>(KEYS.STATS, []);
}

export function saveDailyStats(stats: DailyStats[]): void {
  set(KEYS.STATS, stats);
}

export function getTodayStats(): DailyStats {
  const today = new Date().toISOString().split('T')[0];
  const all = getDailyStats();
  return all.find((s) => s.date === today) ?? {
    date: today,
    studyDuration: 0,
    reviewedCount: 0,
    newCardsCount: 0,
  };
}

export function updateTodayStats(patch: Partial<Omit<DailyStats, 'date'>>): void {
  const today = new Date().toISOString().split('T')[0];
  const all = getDailyStats();
  const idx = all.findIndex((s) => s.date === today);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...patch };
  } else {
    all.push({ date: today, studyDuration: 0, reviewedCount: 0, newCardsCount: 0, ...patch });
  }
  set(KEYS.STATS, all);
}
