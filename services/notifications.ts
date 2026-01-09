
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const sendNotification = async (title: string, body: string) => {
  if (Notification.permission === 'granted') {
    // Try to use Service Worker registration for better mobile support
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        registration.showNotification(title, {
          body,
          icon: './icon.svg',
          badge: './icon.svg',
          vibrate: [100, 50, 100],
          tag: 'cashflow-reminder' // Replace existing by tag to avoid spam
        } as any);
        return;
      }
    }
    
    // Fallback to standard API
    new Notification(title, {
      body,
      icon: './icon.svg',
    });
  }
};
