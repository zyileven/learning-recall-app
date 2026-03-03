import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCardsStore } from '../../store/cardsStore';
import { Button } from '../../components/ui/button';
import { applyReview } from '../../lib/sm2';
import { getFeynmanNotes, saveFeynmanNote } from '../../lib/storage';
import { generateId, formatDate } from '../../lib/utils';
import type { SM2Rating, FeynmanNote } from '../../types';

// ─── Question pool ────────────────────────────────────────────────────────────

const ALL_QUESTIONS = [
  '你提到的核心概念，能用一个生活中的例子来说明吗？',
  '如果有人问「为什么是这样」，你会怎么回答？',
  '这个概念有什么边界条件或例外情况？',
  '能用一句话总结这个概念的本质吗？',
  '这个概念和你已知的哪个概念最相似？有什么不同？',
  '如果去掉这个概念，会发生什么问题？',
  '这个概念是如何解决某个具体问题的？',
  '初学者最容易在哪个地方误解这个概念？',
];

/**
 * 从卡片 id 派生稳定的三个问题（伪随机但固定）
 */
function pickQuestions(cardId: string): string[] {
  // Simple hash of card id → seed
  let seed = 0;
  for (let i = 0; i < cardId.length; i++) {
    seed = (seed * 31 + cardId.charCodeAt(i)) >>> 0;
  }
  const pool = [...ALL_QUESTIONS];
  const result: string[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = seed % pool.length;
    result.push(pool.splice(idx, 1)[0]);
    seed = (seed * 1664525 + 1013904223) >>> 0;
  }
  return result;
}

// ─── Rating config ────────────────────────────────────────────────────────────

interface SelfRatingConfig {
  rating: SM2Rating;
  emoji: string;
  label: string;
  sublabel: string;
  borderClass: string;
  textClass: string;
  hoverClass: string;
}

const SELF_RATING_CONFIGS: SelfRatingConfig[] = [
  { rating: 0, emoji: '😵', label: '理解很浅', sublabel: '重新出发', borderClass: 'border-red-300',    textClass: 'text-red-700',    hoverClass: 'hover:bg-red-50' },
  { rating: 2, emoji: '😕', label: '部分理解', sublabel: '还需加强', borderClass: 'border-orange-300', textClass: 'text-orange-700', hoverClass: 'hover:bg-orange-50' },
  { rating: 4, emoji: '😊', label: '基本掌握', sublabel: '不错！',   borderClass: 'border-green-300',  textClass: 'text-green-700',  hoverClass: 'hover:bg-green-50' },
  { rating: 5, emoji: '🌟', label: '完全掌握', sublabel: '太棒了！', borderClass: 'border-blue-300',   textClass: 'text-blue-700',   hoverClass: 'hover:bg-blue-50' },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

interface StepIndicatorProps {
  current: 1 | 2 | 3;
}

function StepIndicator({ current }: StepIndicatorProps) {
  const steps = [
    { n: 1 as const, label: '初次解释' },
    { n: 2 as const, label: '接受挑战' },
    { n: 3 as const, label: '对照答案' },
  ];
  return (
    <div className="flex items-center gap-1">
      {steps.map(({ n, label }, i) => (
        <div key={n} className="flex items-center gap-1">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              n === current
                ? 'bg-primary text-primary-foreground'
                : n < current
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold border-current">
              {n}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </div>
          {i < 2 && (
            <div className={`w-6 h-px ${n < current ? 'bg-primary' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Initial Explanation ──────────────────────────────────────────────

interface Step1Props {
  title: string;
  category: string;
  explanation: string;
  onExplanationChange: (v: string) => void;
  onNext: () => void;
}

function Step1({ title, category, explanation, onExplanationChange, onNext }: Step1Props) {
  const charCount = explanation.trim().length;
  const tooShort = charCount < 50;

  return (
    <div className="flex-1 flex flex-col px-6 py-6 max-w-3xl mx-auto w-full">
      {/* Intro */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📝</span>
          <h2 className="text-lg font-semibold">请用最简单的语言解释这个概念</h2>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground space-y-1">
          <p>想象你在向一个对此完全陌生的人解释</p>
          <p>不要使用专业术语，如果必须用，请先解释它的含义</p>
        </div>
      </div>

      {/* Card info */}
      <div className="mb-4">
        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
          {category || '未分类'}
        </span>
        <h3 className="text-xl font-bold mt-2">{title}</h3>
      </div>

      {/* Textarea */}
      <textarea
        autoFocus
        value={explanation}
        onChange={(e) => onExplanationChange(e.target.value)}
        placeholder="用你自己的话解释这个概念……"
        className="flex-1 w-full resize-none rounded-xl border border-input bg-background p-4 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[200px]"
      />

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <p className={`text-sm ${tooShort ? 'text-orange-500' : 'text-muted-foreground'}`}>
          {charCount} 字
          {tooShort && ` · 解释太短了，再多说一些（至少 50 字）`}
        </p>
        <Button onClick={onNext} disabled={tooShort}>
          下一步：接受挑战
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: Guided Questions ─────────────────────────────────────────────────

interface Step2Props {
  questions: string[];
  answers: string[];
  onAnswerChange: (idx: number, v: string) => void;
  onBack: () => void;
  onNext: () => void;
}

function Step2({ questions, answers, onAnswerChange, onBack, onNext }: Step2Props) {
  return (
    <div className="flex-1 flex flex-col px-6 py-6 max-w-3xl mx-auto w-full overflow-auto">
      {/* Intro */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🎯</span>
          <h2 className="text-lg font-semibold">挑战问题</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          回答以下问题，发现你的理解是否有遗漏
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-6 flex-1">
        {questions.map((q, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm font-medium leading-snug">{q}</p>
            </div>
            <textarea
              value={answers[i] ?? ''}
              onChange={(e) => onAnswerChange(i, e.target.value)}
              placeholder="写下你的回答……（可以留空）"
              className="w-full resize-none rounded-xl border border-input bg-background p-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px] ml-8"
            />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          上一步
        </Button>
        <Button onClick={onNext}>
          查看标准答案
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Compare & Rate ───────────────────────────────────────────────────

interface Step3Props {
  cardContent: string;
  explanation: string;
  questions: string[];
  answers: string[];
  existingNote: FeynmanNote | null;
  onBack: () => void;
  onComplete: (rating: SM2Rating) => void;
}

function Step3({
  cardContent, explanation, questions, answers,
  existingNote, onBack, onComplete,
}: Step3Props) {
  const [selectedRating, setSelectedRating] = useState<SM2Rating | null>(null);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Split view */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: user's work */}
        <div className="flex-1 flex flex-col p-6 overflow-auto md:border-r">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📝</span>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              你的解释
            </h3>
          </div>

          <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap bg-muted/30 rounded-xl p-4 mb-4">
            {explanation || '（未作答）'}
          </div>

          {questions.map((q, i) => (
            <div key={i} className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                问题 {i + 1}：{q}
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-xl p-3">
                {answers[i]?.trim() || '（未作答）'}
              </p>
            </div>
          ))}
        </div>

        {/* Right: standard answer */}
        <div className="flex-1 flex flex-col p-6 overflow-auto bg-muted/10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📖</span>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              标准参考答案
            </h3>
          </div>
          <div className="flex-1 rounded-xl border bg-card p-5 overflow-auto">
            <div className="markdown-content text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {cardContent || '（暂无详细内容）'}
              </ReactMarkdown>
            </div>
          </div>
          {existingNote && (
            <p className="text-xs text-muted-foreground mt-2">
              上次费曼练习：{formatDate(existingNote.updatedAt)}
            </p>
          )}
        </div>
      </div>

      {/* Self-rating bar */}
      <div className="shrink-0 border-t bg-card px-6 py-4">
        <p className="text-sm text-center text-muted-foreground mb-3">
          对照参考答案，你的解释有多完整？
        </p>
        <div className="flex gap-2 max-w-xl mx-auto mb-4">
          {SELF_RATING_CONFIGS.map(({ rating, emoji, label, sublabel, borderClass, textClass, hoverClass }) => (
            <button
              key={rating}
              onClick={() => setSelectedRating(rating)}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm font-medium transition-all active:scale-95 ${hoverClass} ${borderClass} ${textClass} ${selectedRating === rating ? 'ring-2 ring-offset-1 ring-current' : ''}`}
            >
              <span className="text-xl">{emoji}</span>
              <span className="font-semibold text-xs">{label}</span>
              <span className="text-xs opacity-70">{sublabel}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between max-w-xl mx-auto">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            上一步
          </Button>
          <Button
            onClick={() => selectedRating !== null && onComplete(selectedRating)}
            disabled={selectedRating === null}
          >
            保存笔记并完成练习
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── FeynmanSessionPage ───────────────────────────────────────────────────────

export function FeynmanSessionPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { cards, loadCards, updateCard } = useCardsStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [explanation, setExplanation] = useState('');
  const [answers, setAnswers] = useState<string[]>(['', '', '']);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const card = useMemo(() => cards.find((c) => c.id === id), [cards, id]);
  const questions = useMemo(() => (id ? pickQuestions(id) : []), [id]);
  const existingNote = useMemo(() => {
    if (!id) return null;
    const notes = getFeynmanNotes().filter((n) => n.cardId === id);
    return notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
  }, [id, cards]);

  // Load previous explanation if existing note
  useEffect(() => {
    if (existingNote && !explanation) {
      setExplanation(existingNote.explanation);
      const prevAnswers = questions.map(
        (q) => existingNote.answers.find((a) => a.question === q)?.answer ?? ''
      );
      setAnswers(prevAnswers);
    }
  }, [existingNote, questions]);

  if (!card) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">卡片不存在</p>
          <Button onClick={() => navigate('/feynman')}>返回列表</Button>
        </div>
      </div>
    );
  }

  const handleAnswerChange = (idx: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleComplete = (rating: SM2Rating) => {
    const now = new Date().toISOString();
    const noteId = existingNote?.id ?? generateId();

    const note: FeynmanNote = {
      id: noteId,
      cardId: card.id,
      explanation,
      answers: questions.map((q, i) => ({ question: q, answer: answers[i] ?? '' })),
      selfRating: rating,
      createdAt: existingNote?.createdAt ?? now,
      updatedAt: now,
    };
    saveFeynmanNote(note);

    // Update SM-2 with self rating
    const newSrData = applyReview(card.srData, rating);
    updateCard(card.id, { srData: newSrData });

    navigate('/feynman');
  };

  const handleExit = () => {
    if (confirm('退出费曼练习？当前内容不会保存。')) {
      navigate('/feynman');
    }
  };

  const stepLabels: Record<1 | 2 | 3, string> = {
    1: card.title,
    2: '接受挑战！',
    3: '对照参考答案',
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top bar */}
      <header className="flex items-center gap-4 px-6 py-3 border-b bg-card shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          <span className="font-semibold text-sm hidden sm:inline">费曼学习法</span>
        </div>

        <StepIndicator current={step} />

        <p className="flex-1 text-sm text-muted-foreground truncate hidden md:block px-2">
          {stepLabels[step]}
        </p>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleExit}
          className="gap-1.5 text-muted-foreground shrink-0"
        >
          <X className="w-4 h-4" />
          退出
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {step === 1 && (
          <Step1
            title={card.title}
            category={card.category}
            explanation={explanation}
            onExplanationChange={setExplanation}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step2
            questions={questions}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Step3
            cardContent={card.content}
            explanation={explanation}
            questions={questions}
            answers={answers}
            existingNote={existingNote}
            onBack={() => setStep(2)}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
}
