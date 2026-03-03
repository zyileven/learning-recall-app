import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Clock, RotateCcw, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCardsStore } from '../../store/cardsStore';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { formatDate, formatRelativeDate } from '../../lib/utils';
import { getMasteryLevel } from '../../lib/sm2';

const masteryConfig = {
  new: { label: '新卡片', className: 'text-blue-700 bg-blue-50 border-blue-200' },
  learning: { label: '学习中', className: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  mastered: { label: '已掌握', className: 'text-green-700 bg-green-50 border-green-200' },
};

export function CardDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getCard, deleteCard, loadCards } = useCardsStore();

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const card = id ? getCard(id) : undefined;

  if (!card) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">卡片不存在或已被删除</p>
          <Button onClick={() => navigate('/knowledge')}>返回知识库</Button>
        </div>
      </div>
    );
  }

  const mastery = getMasteryLevel(card.srData);
  const config = masteryConfig[mastery];

  const handleDelete = () => {
    if (confirm(`确定要删除「${card.title}」吗？此操作不可撤销。`)) {
      deleteCard(card.id);
      navigate('/knowledge');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/knowledge')}
          className="mt-0.5 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold mb-2">{card.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {card.category || '未分类'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded border ${config.className}`}>
              {config.label}
            </span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/knowledge/${card.id}/edit`)}
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" />
            编辑
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleDelete}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            删除
          </Button>
        </div>
      </div>

      {/* SR Status Card */}
      <Card className="mb-6 bg-muted/30">
        <CardContent className="py-4 px-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            间隔重复状态
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">下次复习</p>
              <p className="font-semibold">{formatRelativeDate(card.srData.nextReviewDate)}</p>
              <p className="text-xs text-muted-foreground">{formatDate(card.srData.nextReviewDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">复习次数</p>
              <p className="font-semibold">{card.srData.repetitions} 次</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">当前间隔</p>
              <p className="font-semibold">{card.srData.interval} 天</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">难度因子</p>
              <p className="font-semibold">{card.srData.easeFactor.toFixed(2)}</p>
            </div>
          </div>
          {card.srData.lastReviewDate && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" />
              上次复习：{formatDate(card.srData.lastReviewDate)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      {card.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-5">
          {card.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              <Tag className="w-3 h-3" />
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Markdown content */}
      <Card>
        <CardContent className="p-6">
          {card.content ? (
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {card.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-muted-foreground italic">暂无内容</p>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          创建：{formatDate(card.createdAt)}
        </span>
        <span>更新：{formatDate(card.updatedAt)}</span>
      </div>
    </div>
  );
}
