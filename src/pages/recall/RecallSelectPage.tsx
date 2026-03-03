import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, BookOpen, Shuffle, Clock, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { useCardsStore } from '../../store/cardsStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';
import type { KnowledgeCard } from '../../types';

type FilterMode = 'all' | 'due' | 'random';

// We pass selected card IDs via sessionStorage so no URL query string needed
const SESSION_KEY = 'lr_recall_queue';

export function RecallSelectPage() {
  const navigate = useNavigate();
  const { cards, categories, loadCards, getDueCards } = useCardsStore();

  // Selection state
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [randomCount, setRandomCount] = useState(10);
  const [showCardList, setShowCardList] = useState(false);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Compute candidate pool based on filter mode + category selection
  const candidateCards = useMemo<KnowledgeCard[]>(() => {
    let pool = cards;

    // Category filter (if any selected)
    if (selectedCategories.size > 0) {
      pool = pool.filter((c) => selectedCategories.has(c.category));
    }

    if (filterMode === 'due') {
      const now = new Date();
      pool = pool.filter((c) => new Date(c.srData.nextReviewDate) <= now);
    } else if (filterMode === 'random') {
      // Shuffle and take N
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      pool = shuffled.slice(0, Math.min(randomCount, shuffled.length));
    }

    return pool;
  }, [cards, selectedCategories, filterMode, randomCount]);

  // When candidate pool changes, sync selectedCardIds to the pool
  useEffect(() => {
    setSelectedCardIds(new Set(candidateCards.map((c) => c.id)));
  }, [candidateCards]);

  const dueCount = getDueCards().length;

  // ── Handlers ────────────────────────────────────────────────────────────

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const selectAllCategories = () => setSelectedCategories(new Set());

  const toggleCard = (id: string) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllCards = () => {
    if (selectedCardIds.size === candidateCards.length) {
      setSelectedCardIds(new Set());
    } else {
      setSelectedCardIds(new Set(candidateCards.map((c) => c.id)));
    }
  };

  const handleStart = () => {
    if (selectedCardIds.size === 0) return;
    // Persist queue to sessionStorage, then navigate
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...selectedCardIds]));
    navigate('/recall/session');
  };

  // ── Category pills ───────────────────────────────────────────────────────

  const categoryStats = useMemo(() => {
    return categories.map((cat) => ({
      name: cat,
      total: cards.filter((c) => c.category === cat).length,
      due: cards.filter(
        (c) => c.category === cat && new Date(c.srData.nextReviewDate) <= new Date()
      ).length,
    }));
  }, [categories, cards]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">主动回忆练习</h1>
          <p className="text-sm text-muted-foreground">先回忆，再对照答案，强化记忆</p>
        </div>
      </div>

      {/* Filter Mode */}
      <section className="mb-6">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          练习范围
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              mode: 'all' as FilterMode,
              icon: BookOpen,
              label: '全部卡片',
              desc: `共 ${cards.length} 张`,
            },
            {
              mode: 'due' as FilterMode,
              icon: Clock,
              label: '今日到期',
              desc: `${dueCount} 张待复习`,
              disabled: dueCount === 0,
            },
            {
              mode: 'random' as FilterMode,
              icon: Shuffle,
              label: '随机抽取',
              desc: '自定义数量',
            },
          ].map(({ mode, icon: Icon, label, desc, disabled }) => (
            <button
              key={mode}
              disabled={disabled}
              onClick={() => setFilterMode(mode)}
              className={cn(
                'flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all',
                filterMode === mode
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Icon className={cn('w-4 h-4', filterMode === mode ? 'text-primary' : 'text-muted-foreground')} />
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Random count input */}
        {filterMode === 'random' && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">随机抽取</span>
            <Input
              type="number"
              min={1}
              max={cards.length}
              value={randomCount}
              onChange={(e) => setRandomCount(Math.max(1, Math.min(cards.length, parseInt(e.target.value) || 1)))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">张</span>
          </div>
        )}
      </section>

      {/* Category filter */}
      {categories.length > 0 && (
        <section className="mb-6">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            按分类筛选
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={selectAllCategories}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                selectedCategories.size === 0
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary/40'
              )}
            >
              全部
            </button>
            {categoryStats.map(({ name, total, due }) => (
              <button
                key={name}
                onClick={() => toggleCategory(name)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                  selectedCategories.has(name)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:border-primary/40'
                )}
              >
                {name}
                <Badge
                  variant={selectedCategories.has(name) ? 'secondary' : 'outline'}
                  className="text-xs px-1.5 py-0 h-4"
                >
                  {total}
                </Badge>
                {due > 0 && (
                  <span className="text-xs opacity-70">({due} 到期)</span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Card list (collapsible) */}
      {candidateCards.length > 0 && (
        <section className="mb-6">
          <button
            onClick={() => setShowCardList((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 hover:text-foreground transition-colors"
          >
            <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', showCardList && 'rotate-90')} />
            已选卡片（{selectedCardIds.size} / {candidateCards.length}）
          </button>

          {showCardList && (
            <Card>
              <CardContent className="p-3">
                {/* Select all toggle */}
                <button
                  onClick={toggleAllCards}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2 px-1 py-1"
                >
                  {selectedCardIds.size === candidateCards.length
                    ? <CheckSquare className="w-4 h-4 text-primary" />
                    : <Square className="w-4 h-4" />
                  }
                  {selectedCardIds.size === candidateCards.length ? '取消全选' : '全选'}
                </button>
                <div className="space-y-0.5 max-h-60 overflow-y-auto">
                  {candidateCards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => toggleCard(card.id)}
                      className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded hover:bg-muted text-left transition-colors"
                    >
                      {selectedCardIds.has(card.id)
                        ? <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                        : <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                      }
                      <span className="text-sm flex-1 truncate">{card.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{card.category}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Start button */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur pt-4 pb-2 border-t">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedCardIds.size === 0
              ? '请选择至少 1 张卡片'
              : `已选 ${selectedCardIds.size} 张卡片`}
          </p>
          <Button
            onClick={handleStart}
            disabled={selectedCardIds.size === 0}
            size="lg"
          >
            <Brain className="w-4 h-4 mr-2" />
            开始练习
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
