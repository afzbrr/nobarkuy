/**
 * Telegram WebApp Integration Singleton
 * Strictly uses real Telegram.WebApp.initDataUnsafe.user. No simulations or fake users.
 */

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface TelegramWebAppObject {
  initData?: string;
  initDataUnsafe?: {
    query_id?: string;
    user?: TelegramUser;
    auth_date?: string;
    hash?: string;
  };
  colorScheme?: 'light' | 'dark';
  themeParams?: Record<string, unknown>;
  isExpanded?: boolean;
  viewportHeight?: number;
  viewportStableHeight?: number;
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
  showPopup?: (params: unknown, callback?: (buttonId: string) => void) => void;
  showAlert?: (message: string, callback?: () => void) => void;
  showConfirm?: (message: string, callback?: (confirmed: boolean) => void) => void;
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebAppObject;
    };
  }
}

export function getTelegramWebApp(): TelegramWebAppObject | undefined {
  if (typeof window !== 'undefined') {
    return window.Telegram?.WebApp;
  }
  return undefined;
}

export function initTelegram(): void {
  const tg = getTelegramWebApp();
  if (tg) {
    try {
      tg.ready?.();
      tg.expand?.();
    } catch (e) {
      console.warn('Telegram WebApp init warning:', e);
    }
  }
}

export function getTelegramUser(): TelegramUser | null {
  const tg = getTelegramWebApp();
  if (tg?.initDataUnsafe?.user && tg.initDataUnsafe.user.id) {
    return tg.initDataUnsafe.user;
  }
  return null;
}

export function isOwnerUsername(username?: string | null): boolean {
  if (!username) return false;
  return username.replace(/^@/, '').trim().toLowerCase() === 'istamina';
}

export function triggerHaptic(type: 'light' | 'success' | 'warning' = 'light') {
  const tg = getTelegramWebApp();
  if (!tg?.HapticFeedback) return;
  try {
    if (type === 'success' || type === 'warning') {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch (e) {
    // Ignore haptic failures
  }
}
