import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Clock, Tag } from 'lucide-react';
import type { KnowledgeCard } from '../../types';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatDate, formatRelativeDate } from '../../lib/utils';
import { getMasteryLevel } from '../../lib/sm2';

interface KnowledgeCardItemProps {
  card: KnowledgeCard;
  onDelete: (id: string) => void;
}

const masteryColors = {
  new: 'text-blue-600 bg-blue-50 border-blue-200',
  learning: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  mastered: 'text-green-700 bg-green-50 border-green-200',
};

const masteryLabels = {
  new: '新卡片',
  learning: '学习中',
  mastered: '已掌握',
};

export function KnowledgeCardItem({ card, onDelete }: KnowledgeCardItemProps) {
  const navigate = useNavigate();
  const mastery = getMasteryLevel(card.srData);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定要删除「${card.title}」吗？此操作不可撤销。`)) {
      onDelete(card.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/knowledge/${card.id}/edit`);
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow group"
      onClick={() => navigate(`/knowledge/${card.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-snug line-clamp-2 flex-1">
            {card.title}
          </h3>
          {/* Action buttons - show on hover */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleEdit}
              title="编辑"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:text-destructive"
              onClick={handleDelete}
              title="删除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-1">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {card.category || '未分类'}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded border ${masteryColors[mastery]}`}
          >
            {masteryLabels[mastery]}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Content preview */}
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {card.content.replace(/[#*`\[\]]/g, '').trim() || '暂无内容'}
        </p>

        {/* Tags */}
        {card.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-3">
            {card.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                <Tag className="w-2.5 h-2.5 mr-0.5" />
                {tag}
              </Badge>
            ))}
            {card.tags.length > 4 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                +{card.tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDate(card.createdAt)}</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>复习 {formatRelativeDate(card.srData.nextReviewDate)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
