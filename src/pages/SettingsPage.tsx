import { useState } from 'react';
import { Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { getSettings, saveSettings } from '../lib/storage';
import type { UserSettings } from '../types';

export function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-bold mb-6">设置</h1>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">外观</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>主题</Label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings((s) => ({ ...s, theme: e.target.value as UserSettings['theme'] }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="system">跟随系统</option>
                <option value="light">浅色模式</option>
                <option value="dark">深色模式</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">提醒设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="reminder"
                checked={settings.reminderEnabled}
                onChange={(e) => setSettings((s) => ({ ...s, reminderEnabled: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="reminder">开启每日学习提醒</Label>
            </div>
            {settings.reminderEnabled && (
              <div className="space-y-1.5">
                <Label htmlFor="reminderTime">提醒时间</Label>
                <Input
                  id="reminderTime"
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => setSettings((s) => ({ ...s, reminderTime: e.target.value }))}
                  className="w-40"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-1" />
          {saved ? '已保存！' : '保存设置'}
        </Button>
      </div>
    </div>
  );
}
