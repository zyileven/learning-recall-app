import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, PenLine, ChevronRight, BookOpen } from 'lucide-react';
import { useCardsStore } from '../../store/cardsStore';
import { getFeynmanNotes } from '../../lib/storage';
import { formatDate } from '../../lib/utils';

export function FeynmanListPage() {
  const navigate = useNavigate();
  const { cards, categories, loadCards } = useCardsStore();

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Index feynman notes by cardId for O(1) lookup
  const notesByCardId = useMemo(() => {
    const notes = getFeynmanNotes();
    const map = new Map<string, { updatedAt: string; selfRating: number }>();
    for (const note of notes) {
      const existing = map.get(note.cardId);
      if (!existing || note.updatedAt > existing.updatedAt) {
        map.set(note.cardId, {
          updatedAt: note.updatedAt,
          selfRating: note.selfRating,
        });
      }
    }
    return map;
  }, [cards]);

  const ratingLabel: Record<number, { label: string; className: string }> = {
    0: { label: '理解很浅', className: 'text-red-600 bg-red-50' },
    2: { label: '部分理解', className: 'text-orange-600 bg-orange-50' },
    4: { label: '基本掌握', className: 'text-green-600 bg-green-50' },
    5: { label: '完全掌握', className: 'text-blue-600 bg-blue-50' },
  };

  // Group cards by category
  const grouped = useMemo(() => {
    const map = new Map<string, typeof cards>();
    for (const card of cards) {
      const cat = card.category || '未分类';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(card);
    }
    // Sort by category name; put categories that match the sidebar order first
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [cards, categories]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">费曼学习法</h1>
          <p className="text-sm text-muted-foreground">
            用最简单的语言解释概念，发现理解漏洞
          </p>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          共 {cards.length} 张卡片 · {notesByCardId.size} 张有笔记
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">还没有知识卡片</p>
          <button
            onClick={() => navigate('/knowledge/new')}
            className="text-sm text-primary hover:underline"
          >
            前往新建卡片 →
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([category, catCards]) => (
            <section key={category}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                {category}
                <span className="ml-2 font-normal normal-case">
                  ({catCards.length} 张)
                </span>
              </h2>
              <div className="border rounded-xl overflow-hidden divide-y">
                {catCards.map((card) => {
                  const noteInfo = notesByCardId.get(card.id);
                  const rInfo = noteInfo ? ratingLabel[noteInfo.selfRating] : null;

                  return (
                    <button
                      key={card.id}
                      onClick={() => navigate(`/feynman/${card.id}`)}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left group"
                    >
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${noteInfo ? 'bg-yellow-100' : 'bg-muted'}`}>
                        {noteInfo
                          ? <PenLine className="w-4 h-4 text-yellow-600" />
                          : <Lightbulb className="w-4 h-4 text-muted-foreground" />
                        }
                      </div>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{card.title}</p>
                        {noteInfo ? (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            上次练习：{formatDate(noteInfo.updatedAt)}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            尚未练习
                          </p>
                        )}
                      </div>

                      {/* Self-rating badge */}
                      {rInfo && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${rInfo.className}`}>
                          {rInfo.label}
                        </span>
                      )}

                      {/* Arrow */}
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0 group-hover:text-muted-foreground transition-colors" />
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
