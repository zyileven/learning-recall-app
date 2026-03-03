import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, CheckCircle, Trophy, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCardsStore } from '../../store/cardsStore';
import { Button } from '../../components/ui/button';
import { applyReview } from '../../lib/sm2';
import { saveSession, updateTodayStats } from '../../lib/storage';
import { generateId, formatRelativeDate } from '../../lib/utils';
import type { SM2Rating, KnowledgeCard } from '../../types';

// ─── Rating config ──────────────────────────────────────────────────────────

interface RatingConfig {
  rating: SM2Rating;
  emoji: string;
  label: string;
  sublabel: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

const RATING_CONFIGS: RatingConfig[] = [
  {
    rating: 0,
    emoji: '😵',
    label: '又忘了',
    sublabel: '重新开始',
    bgClass: 'hover:bg-red-50',
    borderClass: 'border-red-300',
    textClass: 'text-red-700',
  },
  {
    rating: 2,
    emoji: '😕',
    label: '模糊',
    sublabel: '记忆重置',
    bgClass: 'hover:bg-orange-50',
    borderClass: 'border-orange-300',
    textClass: 'text-orange-700',
  },
  {
    rating: 4,
    emoji: '😊',
    label: '记住了',
    sublabel: '间隔延长',
    bgClass: 'hover:bg-green-50',
    borderClass: 'border-green-300',
    textClass: 'text-green-700',
  },
  {
    rating: 5,
    emoji: '🌟',
    label: '完美',
    sublabel: '大幅延长',
    bgClass: 'hover:bg-blue-50',
    borderClass: 'border-blue-300',
    textClass: 'text-blue-700',
  },
];

// ─── FlipCard Component ─────────────────────────────────────────────────────

interface FlipCardProps {
  card: KnowledgeCard;
  flipped: boolean;
  onFlip: () => void;
}

function FlipCard({ card, flipped, onFlip }: FlipCardProps) {
  // Dynamic height: use a fixed min-height so both sides are stable
  return (
    <div
      className="flip-card w-full cursor-pointer select-none"
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onFlip(); } }}
      aria-label={flipped ? '点击翻回正面' : '点击翻转查看答案'}
    >
      {/* Outer wrapper sets the visible height */}
      <div className="relative" style={{ minHeight: flipped ? undefined : '260px' }}>
        <div className={`flip-card-inner${flipped ? ' flipped' : ''}`}>
          {/* Front */}
          <div className="flip-card-front w-full">
            <div className="rounded-xl border-2 border-dashed border-primary/30 bg-card shadow-lg flex flex-col items-center justify-center text-center px-8 py-14 gap-4"
              style={{ minHeight: '260px' }}>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {card.category || '未分类'}
              </span>
              <h2 className="text-2xl font-bold leading-snug">{card.title}</h2>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                点击翻转查看答案
              </p>
            </div>
          </div>

          {/* Back */}
          <div className="flip-card-back w-full">
            <div className="rounded-xl border bg-card shadow-lg px-8 py-8"
              style={{ minHeight: '260px' }}>
              <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                <RotateCcw className="w-3 h-3" />
                {card.title}
              </p>
              <div className="markdown-content text-sm overflow-auto max-h-[480px]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {card.content || '（暂无详细内容）'}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Session Complete ────────────────────────────────────────────────────────

interface SessionResult {
  cardId: string;
  score: number;
}

interface SessionCompleteProps {
  results: SessionResult[];
  duration: number; // seconds
  onBack: () => void;
}

function SessionComplete({ results, duration, onBack }: SessionCompleteProps) {
  const total = results.length;
  const totalScore = results.reduce((s, r) => s + r.score, 0);
  const avgScore = total > 0 ? (totalScore / total).toFixed(1) : '0';

  const distribution = RATING_CONFIGS.map((rc) => ({
    ...rc,
    count: results.filter((r) => r.score === rc.rating).length,
  }));

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const durationStr = minutes > 0
    ? `${minutes} 分 ${seconds} 秒`
    : `${seconds} 秒`;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-6 py-10 max-w-md mx-auto">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <Trophy className="w-10 h-10 text-primary" />
      </div>

      <div>
        <h2 className="text-2xl font-bold">复习完成！🎉</h2>
        <p className="text-muted-foreground mt-1">本次复习了 {total} 张卡片</p>
      </div>

      {/* Stats */}
      <div className="w-full grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="text-xs">平均得分</span>
          </div>
          <p className="text-2xl font-bold">{avgScore} <span className="text-sm font-normal text-muted-foreground">/ 5</span></p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">用时</span>
          </div>
          <p className="text-2xl font-bold">{durationStr}</p>
        </div>
      </div>

      {/* Distribution */}
      <div className="w-full space-y-2">
        <p className="text-sm font-medium text-left">评分分布</p>
        {distribution.map(({ emoji, label, count, textClass, borderClass }) => {
          if (count === 0) return null;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={label} className="flex items-center gap-3">
              <span className="w-16 text-xs text-right text-muted-foreground shrink-0">
                {emoji} {label}
              </span>
              <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${borderClass} bg-current ${textClass}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-10 text-xs text-muted-foreground shrink-0">{count} 张</span>
            </div>
          );
        })}
      </div>

      <Button className="w-full" onClick={onBack}>
        返回仪表板
      </Button>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

interface EmptyReviewProps {
  nextCard?: KnowledgeCard;
  onBack: () => void;
}

function EmptyReview({ nextCard, onBack }: EmptyReviewProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-6">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">🎉 今日复习已完成！</h2>
        <p className="text-muted-foreground mt-1">所有卡片都已在计划之内</p>
        {nextCard && (
          <p className="text-sm text-muted-foreground mt-3 bg-muted px-4 py-2 rounded-lg inline-block">
            下次复习：「{nextCard.title}」
            {' '}
            {formatRelativeDate(nextCard.srData.nextReviewDate)}
          </p>
        )}
      </div>
      <Button onClick={onBack}>返回仪表板</Button>
    </div>
  );
}

// ─── Main ReviewPage ──────────────────────────────────────────────────────────

export function ReviewPage() {
  const navigate = useNavigate();
  const { cards, loadCards, updateCard, getDueCards } = useCardsStore();

  // Session state
  const [queue, setQueue] = useState<KnowledgeCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [phase, setPhase] = useState<'loading' | 'empty' | 'reviewing' | 'complete'>('loading');
  const startTimeRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string>(generateId());

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Build queue once cards are loaded
  useEffect(() => {
    if (phase !== 'loading') return;
    const due = getDueCards().sort(
      (a, b) =>
        new Date(a.srData.nextReviewDate).getTime() -
        new Date(b.srData.nextReviewDate).getTime()
    );
    setQueue(due);
    startTimeRef.current = Date.now();
    setPhase(due.length === 0 ? 'empty' : 'reviewing');
  }, [cards]);

  // Keyboard shortcuts
  const handleFlip = useCallback(() => setFlipped((f) => !f), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'reviewing') return;
      if (e.key === ' ') { e.preventDefault(); handleFlip(); }
      if (!flipped) return;
      if (e.key === '1') handleRating(0);
      if (e.key === '2') handleRating(2);
      if (e.key === '3') handleRating(4);
      if (e.key === '4') handleRating(5);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, flipped]);

  const handleRating = (rating: SM2Rating) => {
    const currentCard = queue[currentIdx];
    if (!currentCard) return;

    // Apply SM-2 and persist
    const newSrData = applyReview(currentCard.srData, rating);
    updateCard(currentCard.id, { srData: newSrData });

    const newResults = [...results, { cardId: currentCard.id, score: rating }];
    setResults(newResults);

    const nextIdx = currentIdx + 1;
    if (nextIdx >= queue.length) {
      // Session done — persist
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      const totalScore = newResults.reduce((s, r) => s + r.score, 0);

      saveSession({
        id: sessionIdRef.current,
        date: new Date().toISOString(),
        cardsReviewed: newResults.length,
        totalScore,
        duration,
        cardResults: newResults,
      });

      updateTodayStats({
        reviewedCount: newResults.length,
        studyDuration: duration,
      });

      setPhase('complete');
    } else {
      setCurrentIdx(nextIdx);
      setFlipped(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (phase === 'empty') {
    // Find next upcoming card
    const upcoming = [...cards]
      .filter((c) => new Date(c.srData.nextReviewDate) > new Date())
      .sort(
        (a, b) =>
          new Date(a.srData.nextReviewDate).getTime() -
          new Date(b.srData.nextReviewDate).getTime()
      )[0];
    return <EmptyReview nextCard={upcoming} onBack={() => navigate('/')} />;
  }

  if (phase === 'complete') {
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    return (
      <div className="flex h-full overflow-auto">
        <SessionComplete results={results} duration={duration} onBack={() => navigate('/')} />
      </div>
    );
  }

  const currentCard = queue[currentIdx];
  if (!currentCard) return null;

  const progress = currentIdx / queue.length;

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-semibold">复习</h1>
        <span className="ml-auto text-sm text-muted-foreground">
          {currentIdx + 1} / {queue.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted rounded-full mb-6 shrink-0">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Flip card */}
      <div className="mb-6">
        <FlipCard
          card={currentCard}
          flipped={flipped}
          onFlip={handleFlip}
        />
      </div>

      {/* Rating area */}
      <div className={`shrink-0 transition-all duration-300 ${flipped ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'}`}>
        <p className="text-sm text-muted-foreground text-center mb-3">
          你记住了多少？
          <span className="text-xs text-muted-foreground/60 ml-2">(快捷键：1 / 2 / 3 / 4)</span>
        </p>
        <div className="grid grid-cols-4 gap-2">
          {RATING_CONFIGS.map(({ rating, emoji, label, sublabel, bgClass, borderClass, textClass }) => (
            <button
              key={rating}
              onClick={() => handleRating(rating)}
              disabled={!flipped}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm font-medium transition-all active:scale-95 ${bgClass} ${borderClass} ${textClass}`}
            >
              <span className="text-xl">{emoji}</span>
              <span className="font-semibold">{label}</span>
              <span className="text-xs opacity-70">{sublabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Flip hint when not flipped */}
      {!flipped && (
        <div className="shrink-0 text-center mt-4">
          <p className="text-xs text-muted-foreground">
            按 <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">空格</kbd> 翻转卡片
          </p>
        </div>
      )}
    </div>
  );
}
