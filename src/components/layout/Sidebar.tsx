import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  RefreshCw,
  Brain,
  Lightbulb,
  BarChart2,
  Settings,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/', label: '仪表板', icon: LayoutDashboard, end: true },
  { to: '/knowledge', label: '知识库', icon: BookOpen },
  { to: '/review', label: '复习', icon: RefreshCw },
  { to: '/recall', label: '主动回忆', icon: Brain },
  { to: '/feynman', label: '费曼学习', icon: Lightbulb },
  { to: '/stats', label: '统计', icon: BarChart2 },
  { to: '/settings', label: '设置', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="flex flex-col w-60 min-h-screen border-r bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg">学习回忆</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t text-xs text-muted-foreground">
        学习辅助工具 v1.0
      </div>
    </aside>
  );
}
