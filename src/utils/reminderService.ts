// Notification Service for PWA & Local Reminders

export type NotificationStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationPermission(): NotificationStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

export async function sendLocalNotification(
  title: string,
  options: {
    body?: string;
    icon?: string;
    tag?: string;
    data?: any;
  } = {}
): Promise<boolean> {
  const perm = getNotificationPermission();
  if (perm !== 'granted') return false;

  const defaultIcon = '/favicon.ico';
  const notificationOptions = {
    body: options.body || '',
    icon: options.icon || defaultIcon,
    badge: defaultIcon,
    tag: options.tag || 'routine-app-reminder',
    ...options,
  };

  try {
    // 1. Try Service Worker first if registered (Preferred for PWAs)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title, notificationOptions);
        return true;
      }
    }

    // 2. Fallback to standard Window Notification
    new Notification(title, notificationOptions);
    return true;
  } catch (err) {
    console.warn('Failed to dispatch notification:', err);
    try {
      new Notification(title, notificationOptions);
      return true;
    } catch {
      return false;
    }
  }
}

export async function sendTestNotification(): Promise<boolean> {
  return await sendLocalNotification('روتين | تذكير تجريبي 🔔', {
    body: 'التنبيهات تعمل بنجاح! سنذكرك بموعد تمرينك اليومي واستراحات العمل لحماية ظهرك.',
    tag: 'test-reminder',
  });
}
