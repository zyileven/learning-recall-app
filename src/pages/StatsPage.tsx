import { useEffect } from 'react';
import { useCardsStore } from '../store/cardsStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { getMasteryLevel } from '../lib/sm2';
import { getDailyStats } from '../lib/storage';

export function StatsPage() {
  const { cards, loadCards } = useCardsStore();

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const masteryGroups = {
    new: cards.filter((c) => getMasteryLevel(c.srData) === 'new').length,
    learning: cards.filter((c) => getMasteryLevel(c.srData) === 'learning').length,
    mastered: cards.filter((c) => getMasteryLevel(c.srData) === 'mastered').length,
  };

  const recentStats = getDailyStats()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  const categoryGroups = cards.reduce<Record<string, number>>((acc, card) => {
    const cat = card.category || '未分类';
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-bold mb-6">统计</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-muted-foreground">新卡片</p>
            <p className="text-3xl font-bold text-blue-600">{masteryGroups.new}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-muted-foreground">学习中</p>
            <p className="text-3xl font-bold text-yellow-600">{masteryGroups.learning}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-muted-foreground">已掌握</p>
            <p className="text-3xl font-bold text-green-600">{masteryGroups.mastered}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Category distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">分类分布</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(categoryGroups).length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无数据</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(categoryGroups)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, count]) => (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="text-sm flex-1 truncate">{cat}</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${Math.max(4, (count / cards.length) * 100)}px` }}
                        />
                        <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">近 7 天复习记录</CardTitle>
          </CardHeader>
          <CardContent>
            {recentStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无复习记录</p>
            ) : (
              <div className="space-y-2">
                {recentStats.map((stat) => (
                  <div key={stat.date} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-24">{stat.date}</span>
                    <span>{stat.reviewedCount} 张</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
