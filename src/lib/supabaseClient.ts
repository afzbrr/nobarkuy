import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('xxxxxxxx')
);

// Single instance of Supabase Client
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// Multi-tab real-time event hub for instant updates across tabs/windows
const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('nobarkuy_realtime_bus')
  : null;

export function broadcastLocalEvent(type: string, payload: unknown) {
  if (channel) {
    channel.postMessage({ type, payload });
  }
  // Also dispatch in current window
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nobarkuy_bus', { detail: { type, payload } }));
  }
}

export function subscribeToEvents(callback: (type: string, payload: unknown) => void): () => void {
  const onBroadcast = (e: MessageEvent) => {
    if (e.data?.type) {
      callback(e.data.type, e.data.payload);
    }
  };

  const onWindow = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.type) {
      callback(custom.detail.type, custom.detail.payload);
    }
  };

  if (channel) {
    channel.addEventListener('message', onBroadcast);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('nobarkuy_bus', onWindow);
  }

  return () => {
    if (channel) {
      channel.removeEventListener('message', onBroadcast);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('nobarkuy_bus', onWindow);
    }
  };
}
