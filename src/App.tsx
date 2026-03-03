import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { KnowledgePage } from './pages/knowledge/KnowledgePage';
import { CardFormPage } from './pages/knowledge/CardFormPage';
import { CardDetailPage } from './pages/knowledge/CardDetailPage';
import { ReviewPage } from './pages/review/ReviewPage';
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

          {/* Review */}
          <Route path="review" element={<ReviewPage />} />

          {/* Active Recall (placeholder) */}
          <Route
            path="recall"
            element={
              <PlaceholderPage
                title="主动回忆"
                description="在查看答案前，先尝试自己回忆知识点"
              />
            }
          />

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
