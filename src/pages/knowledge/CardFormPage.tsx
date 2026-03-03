import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X, Plus } from 'lucide-react';
import { useCardsStore } from '../../store/cardsStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';

interface CardFormData {
  title: string;
  category: string;
  content: string;
  tags: string[];
}

interface CardFormPageProps {
  mode: 'new' | 'edit';
}

export function CardFormPage({ mode }: CardFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addCard, updateCard, getCard, categories, loadCards } = useCardsStore();

  const [form, setForm] = useState<CardFormData>({
    title: '',
    category: '',
    content: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [newCategoryMode, setNewCategoryMode] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCards();
    if (mode === 'edit' && id) {
      const card = getCard(id);
      if (card) {
        setForm({
          title: card.title,
          category: card.category,
          content: card.content,
          tags: card.tags,
        });
      } else {
        navigate('/knowledge');
      }
    }
  }, [mode, id, loadCards]);

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (form.tags.includes(tag)) {
      setTagInput('');
      return;
    }
    setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('请输入卡片标题');
      return;
    }
    if (!form.category.trim()) {
      setError('请选择或输入分类');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'new') {
        const card = addCard({
          title: form.title.trim(),
          category: form.category.trim(),
          content: form.content,
          tags: form.tags,
        });
        navigate(`/knowledge/${card.id}`);
      } else if (id) {
        updateCard(id, {
          title: form.title.trim(),
          category: form.category.trim(),
          content: form.content,
          tags: form.tags,
        });
        navigate(`/knowledge/${id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-semibold">
          {mode === 'new' ? '新建知识卡片' : '编辑卡片'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title">
            标题 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="输入知识点名称..."
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            autoFocus
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label htmlFor="category">
            分类 <span className="text-destructive">*</span>
          </Label>
          {!newCategoryMode && categories.length > 0 ? (
            <div className="flex gap-2">
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">选择分类...</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewCategoryMode(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                新分类
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                id="category"
                placeholder="输入新分类名称..."
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
              {categories.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNewCategoryMode(false)}
                >
                  选已有
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <Label htmlFor="content">
            内容
            <span className="text-muted-foreground font-normal ml-1 text-xs">(支持 Markdown)</span>
          </Label>
          <Textarea
            id="content"
            placeholder="输入知识点详细内容，支持 Markdown 格式...

# 标题
- 列表项
**加粗** *斜体* `代码`"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            className="min-h-[280px] font-mono text-sm"
          />
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <Label htmlFor="tags">标签</Label>
          <div className="flex gap-2">
            <Input
              id="tags"
              placeholder="输入标签，按 Enter 或逗号添加..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
            />
            <Button type="button" variant="outline" onClick={handleAddTag}>
              添加
            </Button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2">
              {form.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag}
                  <X className="w-3 h-3" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            <Save className="w-4 h-4 mr-1" />
            {saving ? '保存中...' : '保存卡片'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            取消
          </Button>
        </div>
      </form>
    </div>
  );
}
