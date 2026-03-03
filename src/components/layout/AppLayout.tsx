import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';

// Routes that should hide the sidebar (fullscreen mode)
const FULLSCREEN_ROUTES = ['/recall/session'];

export function AppLayout() {
  const location = useLocation();
  const isFullscreen = FULLSCREEN_ROUTES.some((r) =>
    location.pathname.startsWith(r)
  );

  return (
    <div className="flex min-h-screen bg-background">
      {!isFullscreen && <Sidebar />}
      <main className={`flex-1 overflow-auto${isFullscreen ? ' flex flex-col' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}
