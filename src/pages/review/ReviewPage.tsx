import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCardsStore } from '../../store/cardsStore';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { applyReview } from '../../lib/sm2';
import type { SM2Rating } from '../../types';

const ratingButtons: { rating: SM2Rating; label: string; desc: string; className: string }[] = [
  { rating: 0, label: '完全忘了', desc: '重置', className: 'border-red-300 text-red-700 hover:bg-red-50' },
  { rating: 2, label: '模糊', desc: '重置', className: 'border-orange-300 text-orange-700 hover:bg-orange-50' },
  { rating: 3, label: '记住了', desc: '继续', className: 'border-blue-300 text-blue-700 hover:bg-blue-50' },
  { rating: 5, label: '完美记忆', desc: '+间隔', className: 'border-green-300 text-green-700 hover:bg-green-50' },
];

export function ReviewPage() {
  const navigate = useNavigate();
  const { loadCards, getDueCards, updateCard } = useCardsStore();
  const [queue, setQueue] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const { cards } = useCardsStore();

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  useEffect(() => {
    const due = getDueCards();
    setQueue(due.map((c) => c.id));
    setCurrentIdx(0);
    setRevealed(false);
    setDone(due.length === 0);
  }, []);

  const currentCard = cards.find((c) => c.id === queue[currentIdx]);

  const handleRating = (rating: SM2Rating) => {
    if (!currentCard) return;
    const newSrData = applyReview(currentCard.srData, rating);
    updateCard(currentCard.id, { srData: newSrData });

    const nextIdx = currentIdx + 1;
    if (nextIdx >= queue.length) {
      setDone(true);
    } else {
      setCurrentIdx(nextIdx);
      setRevealed(false);
    }
  };

  if (done || queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">
            {queue.length === 0 ? '今日没有待复习卡片' : '复习完成！'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {queue.length === 0
              ? '所有卡片都不在复习队列中'
              : `完成了 ${queue.length} 张卡片的复习`}
          </p>
        </div>
        <Button onClick={() => navigate('/')}>返回仪表板</Button>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-semibold">复习</h1>
        <span className="ml-auto text-sm text-muted-foreground">
          {currentIdx + 1} / {queue.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted rounded-full mb-6">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${((currentIdx) / queue.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <p className="text-xs text-muted-foreground mb-1">{currentCard.category}</p>
          <h2 className="text-xl font-bold mb-4">{currentCard.title}</h2>

          {!revealed ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-muted-foreground text-sm">先尝试回忆，然后查看答案</p>
              <Button onClick={() => setRevealed(true)}>
                <Eye className="w-4 h-4 mr-1.5" />
                显示答案
              </Button>
            </div>
          ) : (
            <div className="border-t pt-4 mt-2">
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentCard.content || '（暂无详细内容）'}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rating buttons */}
      {revealed && (
        <div>
          <p className="text-sm text-muted-foreground text-center mb-3">你记住了多少？</p>
          <div className="grid grid-cols-4 gap-2">
            {ratingButtons.map(({ rating, label, desc, className }) => (
              <button
                key={rating}
                onClick={() => handleRating(rating)}
                className={`flex flex-col items-center gap-0.5 p-3 rounded-md border text-sm font-medium transition-colors ${className}`}
              >
                <span>{label}</span>
                <span className="text-xs opacity-70">{desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
