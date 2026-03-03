import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trophy, CheckCircle, AlertTriangle, Timer } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCardsStore } from '../../store/cardsStore';
import { Button } from '../../components/ui/button';
import { applyReview } from '../../lib/sm2';
import { generateId } from '../../lib/utils';
import { saveSession, updateTodayStats } from '../../lib/storage';
import type { SM2Rating, KnowledgeCard } from '../../types';

const SESSION_KEY = 'lr_recall_queue';

// ─── Rating config (shared pattern from ReviewPage) ──────────────────────────

const RATING_CONFIGS = [
  { rating: 0 as SM2Rating, emoji: '😵', label: '又忘了', sublabel: '重新开始', borderClass: 'border-red-300', textClass: 'text-red-700', hoverClass: 'hover:bg-red-50' },
  { rating: 2 as SM2Rating, emoji: '😕', label: '模糊',   sublabel: '记忆重置', borderClass: 'border-orange-300', textClass: 'text-orange-700', hoverClass: 'hover:bg-orange-50' },
  { rating: 4 as SM2Rating, emoji: '😊', label: '记住了', sublabel: '间隔延长', borderClass: 'border-green-300', textClass: 'text-green-700', hoverClass: 'hover:bg-green-50' },
  { rating: 5 as SM2Rating, emoji: '🌟', label: '完美',   sublabel: '大幅延长', borderClass: 'border-blue-300', textClass: 'text-blue-700', hoverClass: 'hover:bg-blue-50' },
];

// ─── Timer hook ───────────────────────────────────────────────────────────────

function useCardTimer(active: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset + start when active flips to true
  useEffect(() => {
    setElapsed(0);
    if (!active) return;
    intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  const formatted = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  return { elapsed, formatted };
}

// ─── SessionComplete ──────────────────────────────────────────────────────────

interface CardResult { cardId: string; score: number; userAnswer: string; }

interface SessionCompleteProps {
  results: CardResult[];
  cards: KnowledgeCard[];
  duration: number;
  onBack: () => void;
}

function SessionComplete({ results, cards, duration, onBack }: SessionCompleteProps) {
  const total = results.length;
  const totalScore = results.reduce((s, r) => s + r.score, 0);
  const avgScore = total > 0 ? (totalScore / total).toFixed(1) : '0';
  const rememberedCount = results.filter((r) => r.score >= 4).length;
  const rememberRate = total > 0 ? Math.round((rememberedCount / total) * 100) : 0;

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const durationStr = mins > 0 ? `${mins} 分 ${secs} 秒` : `${secs} 秒`;

  // Cards needing review = score < 4
  const needReview = results
    .filter((r) => r.score < 4)
    .map((r) => cards.find((c) => c.id === r.cardId))
    .filter(Boolean) as KnowledgeCard[];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-6 py-10 max-w-lg mx-auto">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <Trophy className="w-10 h-10 text-primary" />
      </div>

      <div>
        <h2 className="text-2xl font-bold">练习完成！🎉</h2>
        <p className="text-muted-foreground mt-1">共练习 {total} 张卡片</p>
      </div>

      {/* Stats row */}
      <div className="w-full grid grid-cols-3 gap-3">
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">平均得分</p>
          <p className="text-2xl font-bold">{avgScore}<span className="text-xs font-normal text-muted-foreground">/5</span></p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">记住率</p>
          <p className="text-2xl font-bold">{rememberRate}<span className="text-xs font-normal text-muted-foreground">%</span></p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">用时</p>
          <p className="text-lg font-bold">{durationStr}</p>
        </div>
      </div>

      {/* Rating distribution */}
      <div className="w-full space-y-2">
        <p className="text-sm font-medium text-left">评分分布</p>
        {RATING_CONFIGS.map(({ emoji, label, rating, textClass, borderClass }) => {
          const count = results.filter((r) => r.score === rating).length;
          if (count === 0) return null;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={rating} className="flex items-center gap-3">
              <span className="w-20 text-xs text-right text-muted-foreground shrink-0">{emoji} {label}</span>
              <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                <div className={`h-full rounded-full ${textClass} ${borderClass} bg-current`} style={{ width: `${pct}%` }} />
              </div>
              <span className="w-10 text-xs text-muted-foreground shrink-0">{count} 张</span>
            </div>
          );
        })}
      </div>

      {/* Needs review list */}
      {needReview.length > 0 && (
        <div className="w-full">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-medium text-left">建议重点复习（{needReview.length} 张）</p>
          </div>
          <div className="space-y-1 text-left max-h-40 overflow-y-auto">
            {needReview.map((card) => (
              <div key={card.id} className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg text-sm">
                <AlertTriangle className="w-3 h-3 text-orange-500 shrink-0" />
                <span className="truncate">{card.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">{card.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button className="w-full" size="lg" onClick={onBack}>
        返回仪表板
      </Button>
    </div>
  );
}

// ─── RecallSessionPage ────────────────────────────────────────────────────────

type Phase = 'thinking' | 'revealed';

export function RecallSessionPage() {
  const navigate = useNavigate();
  const { cards, loadCards, updateCard } = useCardsStore();

  // Session state
  const [queue, setQueue] = useState<KnowledgeCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('thinking');
  const [userAnswer, setUserAnswer] = useState('');
  const [results, setResults] = useState<CardResult[]>([]);
  const [done, setDone] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string>(generateId());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Timer per card (resets on phase change to 'thinking')
  const { formatted: cardTimerStr } = useCardTimer(
    !done && phase === 'thinking'
  );

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Init queue from sessionStorage once cards are loaded
  useEffect(() => {
    if (initialized || cards.length === 0) return;
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) { navigate('/recall'); return; }
    const ids: string[] = JSON.parse(raw);
    const selected = ids
      .map((id) => cards.find((c) => c.id === id))
      .filter(Boolean) as KnowledgeCard[];

    if (selected.length === 0) { navigate('/recall'); return; }
    setQueue(selected);
    startTimeRef.current = Date.now();
    setInitialized(true);
  }, [cards, initialized, navigate]);

  // Focus textarea when new card appears
  useEffect(() => {
    if (phase === 'thinking' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentIdx, phase]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleReveal = useCallback(() => {
    setPhase('revealed');
  }, []);

  const handleRating = useCallback((rating: SM2Rating) => {
    const card = queue[currentIdx];
    if (!card) return;

    // Update SM-2 data
    const newSrData = applyReview(card.srData, rating);
    updateCard(card.id, { srData: newSrData });

    const newResults = [...results, { cardId: card.id, score: rating, userAnswer }];
    setResults(newResults);

    const nextIdx = currentIdx + 1;
    if (nextIdx >= queue.length) {
      // Session complete
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      const totalScore = newResults.reduce((s, r) => s + r.score, 0);
      saveSession({
        id: sessionIdRef.current,
        date: new Date().toISOString(),
        cardsReviewed: newResults.length,
        totalScore,
        duration,
        cardResults: newResults.map(({ cardId, score }) => ({ cardId, score })),
      });
      updateTodayStats({ reviewedCount: newResults.length, studyDuration: duration });
      setDone(true);
    } else {
      setCurrentIdx(nextIdx);
      setPhase('thinking');
      setUserAnswer('');
    }
  }, [queue, currentIdx, results, userAnswer, updateCard]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (phase === 'thinking') {
        // Space/Enter to reveal — but only when NOT typing in textarea
        if ((e.key === ' ' || e.key === 'Enter') && tag !== 'TEXTAREA') {
          e.preventDefault();
          handleReveal();
        }
        return;
      }
      if (phase === 'revealed') {
        if (e.key === '1') { e.preventDefault(); handleRating(0); }
        if (e.key === '2') { e.preventDefault(); handleRating(2); }
        if (e.key === '3') { e.preventDefault(); handleRating(4); }
        if (e.key === '4') { e.preventDefault(); handleRating(5); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, handleReveal, handleRating]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (done) {
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    return (
      <SessionComplete
        results={results}
        cards={cards}
        duration={duration}
        onBack={() => navigate('/')}
      />
    );
  }

  if (!initialized || queue.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  const currentCard = queue[currentIdx];
  const progress = currentIdx / queue.length;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-4 px-6 py-3 border-b bg-card shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">主动回忆练习</span>
          <span className="text-muted-foreground text-sm">
            {currentIdx + 1} / {queue.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Card timer */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Timer className="w-3.5 h-3.5" />
          <span className="font-mono">{cardTimerStr}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => { if (confirm('退出练习？当前进度将不会保存。')) navigate('/recall'); }}
          className="gap-1.5 text-muted-foreground"
        >
          <X className="w-4 h-4" />
          退出
        </Button>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* Left pane — User answer */}
        <div className="flex-1 flex flex-col p-6 md:border-r overflow-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📝</span>
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">你的回答</h2>
          </div>

          {/* Card title as the "question" */}
          <div className="mb-4">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {currentCard.category || '未分类'}
            </span>
            <h3 className="text-xl font-bold mt-2 leading-snug">{currentCard.title}</h3>
          </div>

          <textarea
            ref={textareaRef}
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="用简洁的语言回忆这个知识点的核心内容..."
            className="flex-1 w-full resize-none rounded-xl border border-input bg-background p-4 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[180px]"
            disabled={phase === 'revealed'}
          />

          {/* Hint */}
          {phase === 'thinking' && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">空格</kbd>
              {' '}或点击"显示答案"查看标准答案
            </p>
          )}
        </div>

        {/* Right pane — Standard answer */}
        <div className="flex-1 flex flex-col p-6 overflow-auto bg-muted/20">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📖</span>
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">标准答案</h2>
          </div>

          {phase === 'thinking' ? (
            /* Masked state */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-background/50">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-sm">先完成回忆，再查看答案</p>
              <Button onClick={handleReveal} size="sm">
                显示答案
              </Button>
            </div>
          ) : (
            /* Revealed state */
            <div className="flex-1 rounded-xl border bg-card p-5 overflow-auto">
              <div className="markdown-content text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentCard.content || '（暂无详细内容）'}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom action bar ─────────────────────────────────────────────── */}
      <div className="shrink-0 border-t bg-card px-6 py-4">
        {phase === 'thinking' ? (
          <div className="flex justify-center">
            <Button onClick={handleReveal} size="lg" className="px-10">
              显示答案
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              对照答案，你记住了多少？
              <span className="text-xs text-muted-foreground/60 ml-2">(快捷键 1 / 2 / 3 / 4)</span>
            </p>
            <div className="flex gap-2 w-full max-w-xl">
              {RATING_CONFIGS.map(({ rating, emoji, label, sublabel, borderClass, textClass, hoverClass }) => (
                <button
                  key={rating}
                  onClick={() => handleRating(rating)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm font-medium transition-all active:scale-95 ${hoverClass} ${borderClass} ${textClass}`}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="font-semibold text-xs">{label}</span>
                  <span className="text-xs opacity-70">{sublabel}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
