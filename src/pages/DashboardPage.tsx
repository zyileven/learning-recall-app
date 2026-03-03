import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, RefreshCw, Flame, CheckCircle } from 'lucide-react';
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
  const todayStats = getDailyStats().find(
    (s) => s.date === new Date().toISOString().split('T')[0]
  );
  const streak = getStreak();

  const statsItems = [
    {
      label: '待复习',
      value: dueCards.length,
      icon: RefreshCw,
      color: dueCards.length > 0 ? 'text-orange-500' : 'text-green-500',
      action: dueCards.length > 0 ? () => navigate('/review') : undefined,
      actionLabel: '开始复习',
    },
    {
      label: '总卡片数',
      value: cards.length,
      icon: BookOpen,
      color: 'text-blue-500',
      action: () => navigate('/knowledge'),
      actionLabel: '查看知识库',
    },
    {
      label: '今日已复习',
      value: todayStats?.reviewedCount ?? 0,
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      label: '连续学习天数',
      value: streak,
      icon: Flame,
      color: 'text-orange-400',
    },
  ];

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">仪表板</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </p>
      </div>

      {/* Today's task callout */}
      <Card className={`mb-6 border-2 ${dueCards.length > 0 ? 'border-orange-200 bg-orange-50/50' : 'border-green-200 bg-green-50/50'}`}>
        <CardContent className="py-4 px-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {dueCards.length > 0 ? (
              <RefreshCw className="w-5 h-5 text-orange-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            <div>
              <p className="font-semibold">
                {dueCards.length > 0
                  ? `今日任务：${dueCards.length} 张卡片待复习`
                  : '🎉 今日任务全部完成！'}
              </p>
              <p className="text-sm text-muted-foreground">
                {dueCards.length > 0
                  ? '建议现在开始复习，保持学习连贯性'
                  : '继续保持，明天见！'}
              </p>
            </div>
          </div>
          {dueCards.length > 0 && (
            <Button onClick={() => navigate('/review')}>
              开始复习
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statsItems.map(({ label, value, icon: Icon, color, action, actionLabel }) => (
          <Card key={label} className={action ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} onClick={action}>
            <CardContent className="py-4 px-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{label}</p>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-3xl font-bold">{value}</p>
              {actionLabel && action && (
                <p className="text-xs text-primary mt-1">{actionLabel} →</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="text-base font-semibold mb-3">快速入口</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: '新建卡片', to: '/knowledge/new', icon: BookOpen, desc: '添加新知识点' },
          { label: '知识库', to: '/knowledge', icon: BookOpen, desc: `${cards.length} 张卡片` },
          { label: '开始复习', to: '/review', icon: RefreshCw, desc: `${dueCards.length} 张待复习` },
        ].map(({ label, to, icon: Icon, desc }) => (
          <Card
            key={to}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(to)}
          >
            <CardContent className="py-4 px-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
