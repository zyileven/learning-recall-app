import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { KnowledgePage } from './pages/knowledge/KnowledgePage';
import { CardFormPage } from './pages/knowledge/CardFormPage';
import { CardDetailPage } from './pages/knowledge/CardDetailPage';
import { ReviewPage } from './pages/review/ReviewPage';
import { RecallSelectPage } from './pages/recall/RecallSelectPage';
import { RecallSessionPage } from './pages/recall/RecallSessionPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Dashboard */}
          <Route index element={<DashboardPage />} />

          {/* Knowledge Base */}
          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="knowledge/new" element={<CardFormPage mode="new" />} />
          <Route path="knowledge/:id" element={<CardDetailPage />} />
          <Route path="knowledge/:id/edit" element={<CardFormPage mode="edit" />} />

          {/* Review (SM-2) */}
          <Route path="review" element={<ReviewPage />} />

          {/* Active Recall */}
          <Route path="recall" element={<RecallSelectPage />} />
          <Route path="recall/session" element={<RecallSessionPage />} />

          {/* Feynman (placeholder) */}
          <Route
            path="feynman"
            element={
              <PlaceholderPage
                title="费曼学习法"
                description="用简单语言解释复杂概念，发现理解漏洞"
              />
            }
          />
          <Route path="feynman/:id" element={<Navigate to="/feynman" replace />} />

          {/* Stats */}
          <Route path="stats" element={<StatsPage />} />

          {/* Settings */}
          <Route path="settings" element={<SettingsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
