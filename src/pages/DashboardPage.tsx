import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, RefreshCw, Flame, CheckCircle,
  Brain, Lightbulb, Plus,
} from 'lucide-react';
import { useCardsStore } from '../store/cardsStore';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { getDailyStats, getStreak } from '../lib/storage';

export function DashboardPage() {
  const navigate = useNavigate();
  const { cards, loadCards, getDueCards } = useCardsStore();

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const dueCards = getDueCards();
  const today = new Date().toISOString().split('T')[0];
  const todayStats = getDailyStats().find((s) => s.date === today);
  const streak = getStreak();

  const reviewedToday = todayStats?.reviewedCount ?? 0;
  const totalDue = dueCards.length + reviewedToday; // approximate total due for today
  const progressPct = totalDue > 0 ? Math.min(100, Math.round((reviewedToday / totalDue) * 100)) : (reviewedToday > 0 ? 100 : 0);

  // Key stats
  const statsItems = useMemo(() => [
    {
      label: '待复习',
      value: dueCards.length,
      icon: RefreshCw,
      color: dueCards.length > 0 ? 'text-orange-500' : 'text-green-500',
      action: dueCards.length > 0 ? () => navigate('/review') : undefined,
      actionLabel: dueCards.length > 0 ? '开始复习' : undefined,
    },
    {
      label: '总卡片',
      value: cards.length,
      icon: BookOpen,
      color: 'text-blue-500',
      action: () => navigate('/knowledge'),
      actionLabel: '查看知识库',
    },
    {
      label: '今日已复习',
      value: reviewedToday,
      icon: CheckCircle,
      color: 'text-green-500',
      action: undefined,
      actionLabel: undefined,
    },
    {
      label: '连续学习',
      value: streak,
      icon: Flame,
      color: 'text-orange-400',
      suffix: '天',
      action: undefined,
      actionLabel: undefined,
    },
  ], [dueCards.length, cards.length, reviewedToday, streak]);

  // Learning mode quick entries
  const learnModes = [
    {
      to: '/review',
      icon: RefreshCw,
      label: '间隔复习',
      desc: `${dueCards.length} 张待复习`,
      badge: dueCards.length > 0 ? dueCards.length : null,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
    {
      to: '/recall',
      icon: Brain,
      label: '主动回忆',
      desc: '强化记忆效果',
      badge: null,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      to: '/feynman',
      icon: Lightbulb,
      label: '费曼学习',
      desc: '发现理解漏洞',
      badge: null,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
  ];

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">仪表板</h1>
          <p className="text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
            })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/knowledge/new')}>
          <Plus className="w-4 h-4 mr-1" />
          新建卡片
        </Button>
      </div>

      {/* Today task banner */}
      <Card className={`mb-5 border-2 ${dueCards.length > 0 ? 'border-orange-200 bg-orange-50/40' : 'border-green-200 bg-green-50/40'}`}>
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {dueCards.length > 0
                ? <RefreshCw className="w-4 h-4 text-orange-500" />
                : <CheckCircle className="w-4 h-4 text-green-500" />
              }
              <p className="font-semibold text-sm">
                {dueCards.length > 0
                  ? `今日任务：还有 ${dueCards.length} 张待复习`
                  : '🎉 今日复习任务全部完成！'}
              </p>
            </div>
            {/* Streak badge */}
            {streak > 0 && (
              <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                <Flame className="w-3 h-3" />
                {streak} 天连续
              </div>
            )}
          </div>

          {/* Progress bar: today's goal */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>今日进度</span>
              <span>{reviewedToday} / {totalDue > 0 ? totalDue : '–'} 张</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${dueCards.length === 0 && reviewedToday > 0 ? 'bg-green-500' : 'bg-primary'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {dueCards.length > 0 && (
            <div className="mt-3">
              <Button size="sm" onClick={() => navigate('/review')}>
                开始复习
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statsItems.map(({ label, value, icon: Icon, color, action, actionLabel, suffix }) => (
          <Card
            key={label}
            className={action ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
            onClick={action}
          >
            <CardContent className="py-4 px-5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-muted-foreground">{label}</p>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold">{value}</p>
                {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
              </div>
              {actionLabel && action && (
                <p className="text-xs text-primary mt-1">{actionLabel} →</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Learning modes */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        学习方式
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {learnModes.map(({ to, icon: Icon, label, desc, badge, color, bg }) => (
          <Card
            key={to}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(to)}
          >
            <CardContent className="py-4 px-5 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              {badge !== null && badge > 0 && (
                <span className="shrink-0 min-w-[22px] h-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center px-1.5">
                  {badge}
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick links */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        快速入口
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: '新建卡片', to: '/knowledge/new', desc: '添加新知识点' },
          { label: '知识库', to: '/knowledge', desc: `共 ${cards.length} 张卡片` },
          { label: '学习统计', to: '/stats', desc: '查看进度报告' },
        ].map(({ label, to, desc }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="flex items-center justify-between px-4 py-3 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
          >
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <span className="text-muted-foreground group-hover:text-foreground text-sm">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
