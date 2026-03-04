import { useEffect, useMemo } from 'react';
import { Flame, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { useCardsStore } from '../store/cardsStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { getDailyStats, getStreak } from '../lib/storage';
import { HeatMap } from '../components/charts/HeatMap';
import { DonutChart } from '../components/charts/DonutChart';
import { LineChart } from '../components/charts/LineChart';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isMastered(srData: { easeFactor: number; interval: number }) {
  return srData.easeFactor > 2.5 && srData.interval > 7;
}

function getCardBucket(srData: {
  nextReviewDate: string;
  interval: number;
  repetitions: number;
  easeFactor: number;
}): 'overdue' | 'soon' | 'mastered' | 'new' {
  const now = new Date();
  const nextReview = new Date(srData.nextReviewDate);
  const diffDays = (nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (srData.repetitions === 0) return 'new';
  if (isMastered(srData)) return 'mastered';
  if (nextReview < now) return 'overdue';
  if (diffDays <= 3) return 'soon';
  return 'mastered'; // interval > 7 but not soon
}

// ─── StatsPage ────────────────────────────────────────────────────────────────

export function StatsPage() {
  const { cards, loadCards } = useCardsStore();

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const allStats = getDailyStats();
  const today = new Date().toISOString().split('T')[0];
  const todayStats = allStats.find((s) => s.date === today);
  const streak = getStreak();

  // ── Area 1: top metrics ───────────────────────────────────────────────────
  const masteredCount = cards.filter((c) => isMastered(c.srData)).length;
  const todayMinutes = Math.round((todayStats?.studyDuration ?? 0) / 60);

  const topMetrics = [
    {
      label: '今日复习',
      value: todayStats?.reviewedCount ?? 0,
      suffix: '张',
      icon: CheckCircle,
      iconClass: 'text-green-500',
    },
    {
      label: '今日学习',
      value: todayMinutes,
      suffix: '分钟',
      icon: Clock,
      iconClass: 'text-blue-500',
    },
    {
      label: '连续学习',
      value: streak,
      suffix: '天',
      icon: Flame,
      iconClass: 'text-orange-500',
    },
    {
      label: '已掌握',
      value: masteredCount,
      suffix: `/ ${cards.length}`,
      icon: BookOpen,
      iconClass: 'text-primary',
    },
  ];

  // ── Area 2: heatmap ───────────────────────────────────────────────────────
  const heatMapData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const stat of allStats) {
      map[stat.date] = stat.reviewedCount;
    }
    return map;
  }, [allStats]);

  // ── Area 3: donut ─────────────────────────────────────────────────────────
  const buckets = useMemo(() => {
    const counts = { overdue: 0, soon: 0, mastered: 0, new: 0 };
    for (const card of cards) {
      counts[getCardBucket(card.srData)]++;
    }
    return counts;
  }, [cards]);

  const donutSegments = [
    { label: '需立即复习', value: buckets.overdue, color: '#ef4444', emoji: '🔴' },
    { label: '即将到期',   value: buckets.soon,    color: '#eab308', emoji: '🟡' },
    { label: '已掌握',     value: buckets.mastered, color: '#22c55e', emoji: '🟢' },
    { label: '新卡片',     value: buckets.new,      color: '#94a3b8', emoji: '⚪' },
  ];

  // ── Area 4: line chart (14 days) ──────────────────────────────────────────
  const lineData = useMemo(() => {
    const result: Array<{ label: string; value: number }> = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const stat = allStats.find((s) => s.date === dateStr);
      result.push({
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        value: stat?.reviewedCount ?? 0,
      });
    }
    return result;
  }, [allStats]);

  // ── Area 5: category stats ────────────────────────────────────────────────
  const categoryStats = useMemo(() => {
    const map = new Map<string, { total: number; mastered: number }>();
    for (const card of cards) {
      const cat = card.category || '未分类';
      if (!map.has(cat)) map.set(cat, { total: 0, mastered: 0 });
      const s = map.get(cat)!;
      s.total++;
      if (isMastered(card.srData)) s.mastered++;
    }
    return [...map.entries()]
      .map(([cat, s]) => ({ cat, ...s, rate: s.total > 0 ? s.mastered / s.total : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [cards]);

  const hasAnyData = cards.length > 0 || allStats.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
      <h1 className="text-2xl font-bold">学习统计</h1>

      {!hasAnyData && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground mb-2">还没有学习记录</p>
            <p className="text-sm text-muted-foreground">
              开始复习或创建卡片后，统计数据将在这里显示
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── 区块 1: 顶部数字卡片 ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {topMetrics.map(({ label, value, suffix, icon: Icon, iconClass }) => (
          <Card key={label}>
            <CardContent className="py-4 px-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{label}</p>
                <Icon className={`w-4 h-4 ${iconClass}`} />
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold">{value}</p>
                <span className="text-sm text-muted-foreground">{suffix}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── 区块 2: 热力图 ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">学习热力图（近 91 天）</CardTitle>
        </CardHeader>
        <CardContent>
          <HeatMap data={heatMapData} days={91} />
          {allStats.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2">完成复习后，每天的学习记录将在此显示</p>
          )}
        </CardContent>
      </Card>

      {/* ── 区块 3 + 4: 环形图 + 折线图 ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">掌握程度分布</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart segments={donutSegments} size={160} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">近 14 天复习趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={lineData} height={140} />
          </CardContent>
        </Card>
      </div>

      {/* ── 区块 5: 分类统计 ──────────────────────────────────────────────── */}
      {categoryStats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">分类掌握情况</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-[1fr_3rem_3rem_5rem] gap-2 text-xs text-muted-foreground pb-1 border-b">
                <span>分类</span>
                <span className="text-center">总数</span>
                <span className="text-center">已掌握</span>
                <span className="text-center">掌握率</span>
              </div>
              {categoryStats.map(({ cat, total, mastered, rate }) => (
                <div key={cat} className="grid grid-cols-[1fr_3rem_3rem_5rem] gap-2 items-center">
                  <div>
                    <p className="text-sm font-medium truncate">{cat}</p>
                    <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${rate * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-center">{total}</span>
                  <span className="text-sm text-center text-green-600">{mastered}</span>
                  <span className="text-sm text-center text-muted-foreground">
                    {Math.round(rate * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
