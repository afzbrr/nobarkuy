import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, broadcastLocalEvent, subscribeToEvents } from './supabaseClient';
import {
  UserProfile,
  Room,
  ChatMessage,
  Broadcast,
  CoinGiveaway,
  FlashSale,
  RedeemCode,
  Poll,
  Quiz,
  RouletteWinner,
} from '../types';

export interface HubPresencePayload {
  user: UserProfile;
  rooms: Room[];
  chats: Record<string, ChatMessage[]>;
  polls: Record<string, Poll>;
  quizzes: Record<string, Quiz>;
  broadcasts: Broadcast[];
  giveaways: CoinGiveaway[];
  flashSales: FlashSale[];
  redeemCodes: RedeemCode[];
  rouletteWinners: RouletteWinner[];
  updatedAt: number;
}

class RealtimeOnlineHub {
  private channel: RealtimeChannel | null = null;
  private localUnsub: (() => void) | null = null;
  private latestPresence: HubPresencePayload | null = null;
  private started = false;
  private handlers: {
    onEvent: (type: string, payload: Record<string, unknown>) => void;
    onPresenceSync: (presences: HubPresencePayload[], onlineCount: number) => void;
  } | null = null;

  start(handlers: {
    onEvent: (type: string, payload: Record<string, unknown>) => void;
    onPresenceSync: (presences: HubPresencePayload[], onlineCount: number) => void;
  }) {
    this.handlers = handlers;
    if (this.started) return;
    this.started = true;

    // Local cross-tab bus
    this.localUnsub = subscribeToEvents((type, payload) => {
      this.handlers?.onEvent(type, (payload as Record<string, unknown>) || {});
    });

    if (isSupabaseConfigured && supabase) {
      const ch = supabase.channel('nobarkuy_online_hub_v1', {
        config: {
          broadcast: { self: false },
        },
      });

      ch.on('broadcast', { event: 'hub_event' }, (msg) => {
        const type = msg.payload?.type as string | undefined;
        const payload = (msg.payload?.payload as Record<string, unknown>) || {};
        if (type) {
          this.handlers?.onEvent(type, payload);
        }
      });

      ch.on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState<HubPresencePayload>();
        const presences: HubPresencePayload[] = [];
        const uniqueUsers = new Set<string>();
        Object.values(state).forEach((entries) => {
          entries.forEach((entry) => {
            if (entry?.user?.user_id) {
              uniqueUsers.add(entry.user.user_id);
              presences.push(entry);
            }
          });
        });
        this.handlers?.onPresenceSync(presences, Math.max(1, uniqueUsers.size));
      });

      ch.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && this.latestPresence) {
          await ch.track(this.latestPresence).catch(() => {});
        }
      });

      this.channel = ch;
    }
  }

  stop() {
    this.started = false;
    this.handlers = null;
    if (this.localUnsub) {
      this.localUnsub();
      this.localUnsub = null;
    }
    if (this.channel && supabase) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  trackState(state: HubPresencePayload) {
    this.latestPresence = state;
    if (this.channel) {
      this.channel.track(state).catch(() => {});
    }
  }

  emit(type: string, payload: Record<string, unknown>) {
    broadcastLocalEvent(type, payload);
    if (this.channel) {
      this.channel
        .send({
          type: 'broadcast',
          event: 'hub_event',
          payload: { type, payload },
        })
        .catch(() => {});
    }
  }
}

export const onlineHub = new RealtimeOnlineHub();
