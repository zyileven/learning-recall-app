import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { KnowledgePage } from './pages/knowledge/KnowledgePage';
import { CardFormPage } from './pages/knowledge/CardFormPage';
import { CardDetailPage } from './pages/knowledge/CardDetailPage';
import { ReviewPage } from './pages/review/ReviewPage';
import { RecallSelectPage } from './pages/recall/RecallSelectPage';
import { RecallSessionPage } from './pages/recall/RecallSessionPage';
import { FeynmanListPage } from './pages/feynman/FeynmanListPage';
import { FeynmanSessionPage } from './pages/feynman/FeynmanSessionPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ToastProvider, useToast } from './components/ui/Toast';
import { getSettings, getCards, getStreak, hasDueNotifiedToday, markDueNotifiedToday } from './lib/storage';
import {
  setToastFallback,
  scheduleDailyReminder,
  getPermissionStatus,
  checkDueCardsAndNotify,
} from './lib/notifications';
import { applyTheme } from './lib/utils';

// ─── Startup initializer (runs inside ToastProvider so useToast works) ────────

function AppInit() {
  const { showToast } = useToast();

  useEffect(() => {
    // 1. Wire toast fallback for notifications
    setToastFallback((title, body) => showToast(title, body));

    // 2. Apply saved theme
    const settings = getSettings();
    applyTheme(settings.theme);

    // 3. Listen for system theme changes if set to 'system'
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onMqChange = () => {
      if (getSettings().theme === 'system') applyTheme('system');
    };
    mq.addEventListener('change', onMqChange);

    // 4. Schedule reminder if enabled + permission granted
    if (settings.reminderEnabled && getPermissionStatus() === 'granted') {
      const getDueCount = () => {
        const now = new Date();
        return getCards().filter((c) => new Date(c.srData.nextReviewDate) <= now).length;
      };
      scheduleDailyReminder(settings.reminderTime, () => ({
        dueCount: getDueCount(),
        streak: getStreak(),
      }));

      // 5. Immediate due-cards check (once per day, if mode is daily+due)
      if (settings.reminderMode === 'daily+due' && !hasDueNotifiedToday()) {
        const dueCount = getDueCount();
        if (dueCount > 0) {
          checkDueCardsAndNotify(dueCount);
          markDueNotifiedToday();
        }
      }
    }

    return () => mq.removeEventListener('change', onMqChange);
  }, []);

  return null;
}

// ─── Router ───────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <BrowserRouter>
      <AppInit />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />

          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="knowledge/new" element={<CardFormPage mode="new" />} />
          <Route path="knowledge/:id" element={<CardDetailPage />} />
          <Route path="knowledge/:id/edit" element={<CardFormPage mode="edit" />} />

          <Route path="review" element={<ReviewPage />} />

          <Route path="recall" element={<RecallSelectPage />} />
          <Route path="recall/session" element={<RecallSessionPage />} />

          <Route path="feynman" element={<FeynmanListPage />} />
          <Route path="feynman/:id" element={<FeynmanSessionPage />} />

          <Route path="stats" element={<StatsPage />} />
          <Route path="settings" element={<SettingsPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}
