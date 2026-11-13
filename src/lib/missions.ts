import { DailyMission } from '../types';

export function getTodayKey(date = new Date()): string {
  const wib = new Date(date.getTime() + 7 * 3600 * 1000);
  return wib.toISOString().split('T')[0];
}

// Weekly reset key (every Monday 00:00 WIB -> YYYY-WXX)
export function getWeekKey(date = new Date()): string {
  const wib = new Date(date.getTime() + 7 * 3600 * 1000);
  const d = new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export interface MissionProgressCounters {
  watched: number;
  chats: number;
  gifts: number;
  votes: number;
  transfers: number;
  claims?: Record<string, boolean>;
}

export function buildWeeklyMissions(counters?: Partial<MissionProgressCounters>): DailyMission[] {
  const claims = counters?.claims || {};
  return [
    {
      id: 'm-1',
      judul: 'Nonton di Room Nobar 1x',
      hadiahCoin: 10,
      target: 1,
      current: Math.min(1, counters?.watched || 0),
      klaim: Boolean(claims['m-1']),
    },
    {
      id: 'm-2',
      judul: 'Chat 5x di Room Nobar',
      hadiahCoin: 10,
      target: 5,
      current: Math.min(5, counters?.chats || 0),
      klaim: Boolean(claims['m-2']),
    },
    {
      id: 'm-3',
      judul: 'Kasih Gift 1x di Room',
      hadiahCoin: 10,
      target: 1,
      current: Math.min(1, counters?.gifts || 0),
      klaim: Boolean(claims['m-3']),
    },
    {
      id: 'm-4',
      judul: 'Vote Poll 1x di Room',
      hadiahCoin: 5,
      target: 1,
      current: Math.min(1, counters?.votes || 0),
      klaim: Boolean(claims['m-4']),
    },
    {
      id: 'm-5',
      judul: 'Transfer Coin ke temen 1x',
      hadiahCoin: 5,
      target: 1,
      current: Math.min(1, counters?.transfers || 0),
      klaim: Boolean(claims['m-5']),
    },
  ];
}
