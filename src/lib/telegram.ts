/**
 * Telegram WebApp Integration Singleton
 * Handles real Telegram.WebApp.initDataUnsafe.user and test environment switching.
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

// Preset simulated accounts for development & testing
export const SIMULATED_USERS = {
  FAIZ_OWNER: {
    id: 6189849073,
    first_name: 'Faiz',
    last_name: '',
    username: 'istamina',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
  BIMO: {
    id: 198471239,
    first_name: 'Bimo',
    last_name: 'Prakoso',
    username: 'bimo12',
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
  },
  AYU: {
    id: 284719283,
    first_name: 'Ayu',
    last_name: 'Alodia',
    username: 'ayualodia',
    photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  },
};

const DEV_OVERRIDE_KEY = 'nobarkuy_dev_user_override';

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
  // Check localStorage dev override first (for easy switching in AI Studio web preview)
  const override = localStorage.getItem(DEV_OVERRIDE_KEY);
  if (override === 'NONE') {
    return null; // Simulates pure browser without Telegram
  }
  if (override === 'BIMO') return SIMULATED_USERS.BIMO;
  if (override === 'AYU') return SIMULATED_USERS.AYU;
  if (override === 'FAIZ') return SIMULATED_USERS.FAIZ_OWNER;

  // Real Telegram WebApp
  const tg = getTelegramWebApp();
  if (tg?.initDataUnsafe?.user) {
    return tg.initDataUnsafe.user;
  }

  // Default to Faiz Owner for smooth instant test preview if no real Telegram detected
  return SIMULATED_USERS.FAIZ_OWNER;
}

export function setDevUserSimulation(mode: 'FAIZ' | 'BIMO' | 'AYU' | 'NONE') {
  localStorage.setItem(DEV_OVERRIDE_KEY, mode);
  window.dispatchEvent(new Event('telegram_user_changed'));
}

export function isOwnerUser(userId: string | number): boolean {
  return String(userId) === '6189849073';
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
    // Ignore haptic failures on unsupported clients
  }
}
