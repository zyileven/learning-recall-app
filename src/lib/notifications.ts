/**
 * Browser Notification API wrapper with graceful fallback.
 * Toast fallback is handled externally via toastFallback callback.
 */

type ToastFallback = (title: string, body: string) => void;

let _toastFallback: ToastFallback | null = null;
let _reminderTimeoutId: ReturnType<typeof setTimeout> | null = null;

// ─── Registration ─────────────────────────────────────────────────────────────

/** Call once at app startup to wire up the Toast fallback */
export function setToastFallback(fn: ToastFallback): void {
  _toastFallback = fn;
}

// ─── Permission ───────────────────────────────────────────────────────────────

export function getPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return Notification.requestPermission();
}

// ─── Send ─────────────────────────────────────────────────────────────────────

export function sendNotification(title: string, body: string, options?: NotificationOptions): void {
  if (getPermissionStatus() === 'granted') {
    try {
      new Notification(title, { body, icon: '/favicon.ico', ...options });
      return;
    } catch {
      // Fall through to toast
    }
  }
  // Toast fallback
  _toastFallback?.(title, body);
}

// ─── Scheduling ───────────────────────────────────────────────────────────────

/**
 * Calculate ms until the next occurrence of HH:MM (today or tomorrow).
 */
function msUntil(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

/**
 * Schedule the daily reminder. Fires once, then recursively schedules itself 24h later.
 * @param getContext - called at fire time to get current due count + streak
 */
export function scheduleDailyReminder(
  timeStr: string,
  getContext: () => { dueCount: number; streak: number }
): void {
  cancelReminder();

  const delay = msUntil(timeStr);

  _reminderTimeoutId = setTimeout(() => {
    const { dueCount, streak } = getContext();
    sendNotification(
      '📚 学习时间到！',
      `你有 ${dueCount} 张卡片待复习，保持学习习惯，坚持第 ${streak} 天！`
    );
    // Re-schedule for next day (24h)
    _reminderTimeoutId = setTimeout(() => {
      scheduleDailyReminder(timeStr, getContext);
    }, 24 * 60 * 60 * 1000);
  }, delay);
}

export function cancelReminder(): void {
  if (_reminderTimeoutId !== null) {
    clearTimeout(_reminderTimeoutId);
    _reminderTimeoutId = null;
  }
}

// ─── Due-cards check ──────────────────────────────────────────────────────────

export function checkDueCardsAndNotify(dueCount: number): void {
  if (dueCount === 0) return;
  sendNotification(
    '⏰ 有卡片待复习',
    `${dueCount} 张卡片今天到期，趁现在复习一下？`
  );
}

// ─── Test ─────────────────────────────────────────────────────────────────────

export function sendTestNotification(): void {
  sendNotification(
    '🔔 测试提醒',
    '学习提醒功能正常工作！记得按时复习哦。'
  );
}
