import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BookOpen, Tag } from 'lucide-react';
import { useCardsStore } from '../../store/cardsStore';
import { KnowledgeCardItem } from '../../components/knowledge/KnowledgeCardItem';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/utils';

export function KnowledgePage() {
  const navigate = useNavigate();
  const { cards, categories, loadCards, deleteCard } = useCardsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Filtered cards
  const filteredCards = (() => {
    let result = cards;

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((c) => c.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.content.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  })();

  const handleDelete = (id: string) => {
    deleteCard(id);
  };

  return (
    <div className="flex h-full">
      {/* Category sidebar */}
      <aside className="w-52 min-h-full border-r bg-card/50 px-3 py-4 shrink-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
          分类
        </p>
        <nav className="space-y-0.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'flex items-center justify-between w-full px-2 py-1.5 rounded text-sm transition-colors',
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              全部
            </span>
            <span className="text-xs">{cards.length}</span>
          </button>

          {categories.map((cat) => {
            const count = cards.filter((c) => c.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'flex items-center justify-between w-full px-2 py-1.5 rounded text-sm transition-colors',
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Tag className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{cat}</span>
                </span>
                <span className="text-xs ml-1">{count}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="px-6 py-4 border-b flex items-center gap-3">
          <h1 className="text-xl font-semibold mr-auto">
            知识库
            {selectedCategory !== 'all' && (
              <span className="text-muted-foreground font-normal text-base ml-2">
                / {selectedCategory}
              </span>
            )}
          </h1>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索卡片..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => navigate('/knowledge/new')}>
            <Plus className="w-4 h-4 mr-1" />
            新建卡片
          </Button>
        </div>

        {/* Card grid */}
        <div className="flex-1 overflow-auto p-6">
          {filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/40" />
              <div>
                <p className="text-muted-foreground font-medium">
                  {searchQuery || selectedCategory !== 'all'
                    ? '没有找到匹配的卡片'
                    : '还没有知识卡片'}
                </p>
                {!searchQuery && selectedCategory === 'all' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    点击「新建卡片」开始添加你的第一张知识卡片
                  </p>
                )}
              </div>
              {!searchQuery && selectedCategory === 'all' && (
                <Button onClick={() => navigate('/knowledge/new')}>
                  <Plus className="w-4 h-4 mr-1" />
                  新建卡片
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                共 {filteredCards.length} 张卡片
                {searchQuery && ` — 搜索「${searchQuery}」`}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCards.map((card) => (
                  <KnowledgeCardItem
                    key={card.id}
                    card={card}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
