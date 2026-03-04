import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Sun, Database, CheckCircle, XCircle, AlertCircle,
  Download, Upload, Trash2, Play,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/Toast';
import {
  getSettings, saveSettings,
  exportAllData, importAllData, clearAllData,
} from '../lib/storage';
import {
  getPermissionStatus, requestPermission,
  scheduleDailyReminder, cancelReminder,
  sendTestNotification, setToastFallback,
} from '../lib/notifications';
import { applyTheme } from '../lib/utils';
import { getCards } from '../lib/storage';
import type { UserSettings } from '../types';

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ─── Permission Badge ─────────────────────────────────────────────────────────

function PermissionBadge({ status }: { status: NotificationPermission | 'unsupported' }) {
  if (status === 'granted')
    return (
      <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3" /> 已授权
      </span>
    );
  if (status === 'denied')
    return (
      <span className="flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" /> 已拒绝
      </span>
    );
  if (status === 'unsupported')
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted border px-2 py-0.5 rounded-full">
        <AlertCircle className="w-3 h-3" /> 不支持
      </span>
    );
  // default: 'default' (not yet asked)
  return (
    <span className="flex items-center gap-1 text-xs text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
      <AlertCircle className="w-3 h-3" /> 未授权
    </span>
  );
}

// ─── SettingsPage ─────────────────────────────────────────────────────────────

export function SettingsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [permStatus, setPermStatus] = useState<NotificationPermission | 'unsupported'>(
    getPermissionStatus()
  );
  const [saving, setSaving] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Wire up toast fallback for notifications lib
  useEffect(() => {
    setToastFallback((title, body) => showToast(title, body));
  }, [showToast]);

  // Apply theme immediately on change
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  // ── Reminder helpers ────────────────────────────────────────────────────

  const getDueCount = () => {
    const now = new Date();
    return getCards().filter((c) => new Date(c.srData.nextReviewDate) <= now).length;
  };

  const applyReminderSettings = (s: UserSettings) => {
    if (s.reminderEnabled && permStatus === 'granted') {
      scheduleDailyReminder(s.reminderTime, () => ({
        dueCount: getDueCount(),
        streak: 0,
      }));
    } else {
      cancelReminder();
    }
  };

  // ── Save ────────────────────────────────────────────────────────────────

  const handleSave = () => {
    setSaving(true);
    saveSettings(settings);
    applyReminderSettings(settings);
    setTimeout(() => {
      setSaving(false);
      showToast('设置已保存', undefined, 'success');
    }, 300);
  };

  // ── Permission ──────────────────────────────────────────────────────────

  const handleRequestPermission = async () => {
    const perm = await requestPermission();
    setPermStatus(perm);
    if (perm === 'granted') {
      showToast('通知权限已授权 ✅', '现在可以接收学习提醒了', 'success');
      applyReminderSettings(settings);
    } else {
      showToast('权限请求被拒绝', '请在浏览器设置中手动开启通知权限', 'error');
    }
  };

  // ── Test notification ────────────────────────────────────────────────────

  const handleTest = () => {
    sendTestNotification();
    if (permStatus !== 'granted') {
      showToast('🔔 测试提醒', '学习提醒功能正常工作！记得按时复习哦。');
    }
  };

  // ── Export ───────────────────────────────────────────────────────────────

  const handleExport = () => {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-recall-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('数据导出成功 ✅', '文件已下载到你的设备', 'success');
  };

  // ── Import ───────────────────────────────────────────────────────────────

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        importAllData(ev.target?.result as string);
        showToast('数据导入成功 ✅', '请刷新页面以加载新数据', 'success');
      } catch {
        showToast('导入失败', '文件格式不正确', 'error');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (importInputRef.current) importInputRef.current.value = '';
  };

  // ── Clear ────────────────────────────────────────────────────────────────

  const handleClear = () => {
    if (!confirm('确定要清除所有数据吗？此操作不可撤销，所有卡片、记录和设置将被删除。')) return;
    if (!confirm('再次确认：清除后数据无法恢复，确定继续？')) return;
    clearAllData();
    showToast('数据已清除', '即将跳转到仪表板', 'error');
    setTimeout(() => navigate('/'), 1200);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
      <h1 className="text-2xl font-bold">设置</h1>

      {/* ── 提醒设置 ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" />
            提醒设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Permission status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">通知权限</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {permStatus === 'denied'
                  ? '已拒绝，需在浏览器设置中手动开启'
                  : permStatus === 'unsupported'
                  ? '当前环境不支持浏览器通知'
                  : '用于发送学习提醒'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <PermissionBadge status={permStatus} />
              {permStatus === 'default' && (
                <Button size="sm" variant="outline" onClick={handleRequestPermission}>
                  请求权限
                </Button>
              )}
            </div>
          </div>

          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="reminder-toggle" className="cursor-pointer">
              <p className="text-sm font-medium">开启每日学习提醒</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                在设定时间发送提醒通知
              </p>
            </Label>
            <Toggle
              id="reminder-toggle"
              checked={settings.reminderEnabled}
              onChange={(v) => setSettings((s) => ({ ...s, reminderEnabled: v }))}
            />
          </div>

          {settings.reminderEnabled && (
            <>
              {/* Time picker */}
              <div className="flex items-center gap-4">
                <Label htmlFor="reminderTime" className="shrink-0 text-sm">
                  提醒时间
                </Label>
                <Input
                  id="reminderTime"
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => setSettings((s) => ({ ...s, reminderTime: e.target.value }))}
                  className="w-36"
                />
              </div>

              {/* Mode */}
              <div className="space-y-2">
                <Label className="text-sm">提醒频率</Label>
                {(
                  [
                    { value: 'daily', label: '仅每日定时提醒' },
                    { value: 'daily+due', label: '每日定时 + 有到期卡片时额外提醒' },
                  ] as const
                ).map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reminderMode"
                      value={value}
                      checked={settings.reminderMode === value}
                      onChange={() =>
                        setSettings((s) => ({ ...s, reminderMode: value }))
                      }
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          {/* Test button */}
          <div className="flex items-center gap-3 pt-1 border-t">
            <Button variant="outline" size="sm" onClick={handleTest}>
              <Play className="w-3.5 h-3.5 mr-1.5" />
              测试提醒
            </Button>
            <p className="text-xs text-muted-foreground">
              立即发送一条测试通知（若无权限则显示应用内提示）
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── 外观设置 ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sun className="w-4 h-4" />
            外观
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm">主题</Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: 'system', label: '跟随系统', emoji: '💻' },
                  { value: 'light',  label: '浅色',     emoji: '☀️' },
                  { value: 'dark',   label: '深色',     emoji: '🌙' },
                ] as const
              ).map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setSettings((s) => ({ ...s, theme: value }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm transition-colors ${
                    settings.theme === value
                      ? 'border-primary bg-primary/5 text-primary font-semibold'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 数据设置 ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4" />
            数据管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">导出数据</p>
              <p className="text-xs text-muted-foreground">将所有数据导出为 JSON 文件</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              导出
            </Button>
          </div>

          {/* Import */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">导入数据</p>
              <p className="text-xs text-muted-foreground">上传备份 JSON 文件恢复数据</p>
            </div>
            <div>
              <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => importInputRef.current?.click()}
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                导入
              </Button>
            </div>
          </div>

          {/* Clear */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <p className="text-sm font-medium text-destructive">清除所有数据</p>
              <p className="text-xs text-muted-foreground">删除所有卡片、记录和设置，不可恢复</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleClear}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              清除
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end pb-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存设置'}
        </Button>
      </div>
    </div>
  );
}
