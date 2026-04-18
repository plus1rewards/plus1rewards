/**
 * Push Notification Service
 * Handles browser push notifications for PWA
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  vibrate?: number[];
}

/**
 * Check if push notifications are supported
 */
export const isPushNotificationSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

/**
 * Check current notification permission status
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!isPushNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Show a local notification (doesn't require push subscription)
 * This is used for immediate notifications when the app is open
 */
export const showLocalNotification = async (payload: NotificationPayload): Promise<void> => {
  if (!isPushNotificationSupported()) {
    console.warn('Notifications are not supported');
    return;
  }

  const permission = await requestNotificationPermission();
  
  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Show notification through service worker
    await registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/logo.png',
      badge: payload.badge || '/favicon.svg',
      tag: payload.tag || 'local-notification',
      data: payload.data || {},
      requireInteraction: payload.requireInteraction || false,
      vibrate: payload.vibrate || [200, 100, 200],
      silent: false,
    });
  } catch (error) {
    console.error('Error showing local notification:', error);
  }
};

/**
 * Check if user has granted notification permission
 */
export const hasNotificationPermission = (): boolean => {
  return getNotificationPermission() === 'granted';
};

/**
 * Initialize notifications - request permission if not already granted
 */
export const initializeNotifications = async (): Promise<boolean> => {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported');
    return false;
  }

  const currentPermission = getNotificationPermission();
  
  if (currentPermission === 'granted') {
    return true;
  }

  if (currentPermission === 'denied') {
    console.warn('Notification permission was previously denied');
    return false;
  }

  // Permission is 'default', ask user
  const permission = await requestNotificationPermission();
  return permission === 'granted';
};

/**
 * Test notification - useful for debugging
 */
export const sendTestNotification = async (): Promise<void> => {
  await showLocalNotification({
    title: '+1 Rewards Test',
    body: 'Push notifications are working!',
    tag: 'test-notification',
  });
};
