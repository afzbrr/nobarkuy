import { supabase, isSupabaseConfigured } from './supabaseClient';
import { FeedPost, FeedLike, FeedComment, UserProfile } from '../types';
import { filterKataKasar } from './feedHelpers';

export function normalizeSupabasePost(row: Record<string, unknown>, usersMap?: Record<string, UserProfile>): FeedPost {
  const uid = String(row.user_id || '');
  const u = usersMap?.[uid];
  const reportedBy = Array.isArray(row.reported_by)
    ? row.reported_by.map(String)
    : [];
  const reportsCount = Number(row.reports_count ?? reportedBy.length ?? 0);

  return {
    id: String(row.id || ''),
    user_id: uid,
    nama: String(row.nama || row.author_name || u?.nama || 'User'),
    username: String(row.username || u?.username || `user_${uid}`),
    foto_profil: String(row.foto_profil || row.foto || row.avatar_url || u?.foto || ''),
    border: String(row.border || row.border_id || u?.border_saat_ini || 'pemula'),
    custom_text: row.custom_text ? String(row.custom_text) : u?.custom_text || '',
    image_url: String(row.image_url || row.foto_post || row.photo_url || ''),
    caption: filterKataKasar(String(row.caption || row.isi || '')),
    tag: String(row.tag || 'Nobar'),
    likes_count: Number(row.likes_count ?? 0),
    comments_count: Number(row.comments_count ?? 0),
    is_pinned: Boolean(row.is_pinned),
    reports_count: reportsCount,
    reported_by: reportedBy,
    is_hidden: Boolean(row.is_hidden) || reportsCount >= 3,
    created_at: String(row.created_at || new Date().toISOString()),
  };
}

export function normalizeSupabaseLike(row: Record<string, unknown>, usersMap?: Record<string, UserProfile>): FeedLike {
  const uid = String(row.user_id || '');
  const u = usersMap?.[uid];
  return {
    id: String(row.id || `${row.post_id}_${uid}`),
    post_id: String(row.post_id || ''),
    user_id: uid,
    nama: String(row.nama || u?.nama || 'User'),
    username: String(row.username || u?.username || `user_${uid}`),
    foto_profil: String(row.foto_profil || row.foto || row.avatar_url || u?.foto || ''),
    border: String(row.border || u?.border_saat_ini || 'pemula'),
    created_at: String(row.created_at || new Date().toISOString()),
  };
}

export function normalizeSupabaseComment(row: Record<string, unknown>, usersMap?: Record<string, UserProfile>): FeedComment {
  const uid = String(row.user_id || '');
  const u = usersMap?.[uid];
  const likedBy = Array.isArray(row.liked_by) ? row.liked_by.map(String) : [];
  return {
    id: String(row.id || ''),
    post_id: String(row.post_id || ''),
    user_id: uid,
    nama: String(row.nama || u?.nama || 'User'),
    username: String(row.username || u?.username || `user_${uid}`),
    foto_profil: String(row.foto_profil || row.foto || row.avatar_url || u?.foto || ''),
    border: String(row.border || u?.border_saat_ini || 'pemula'),
    isi: filterKataKasar(String(row.isi || row.content || row.komentar || '')),
    parent_id: row.parent_id ? String(row.parent_id) : null,
    reply_to_nama: row.reply_to_nama ? String(row.reply_to_nama) : null,
    likes_count: Number(row.likes_count ?? likedBy.length ?? 0),
    liked_by: likedBy,
    created_at: String(row.created_at || new Date().toISOString()),
  };
}

export async function fetchFeedFromSupabase(usersMap?: Record<string, UserProfile>): Promise<{
  posts: FeedPost[];
  likes: FeedLike[];
  comments: FeedComment[];
} | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const [postsRes, likesRes, commentsRes] = await Promise.all([
      supabase.from('posts').select('*').order('created_at', { ascending: false }),
      supabase.from('likes').select('*').order('created_at', { ascending: false }),
      supabase.from('comments').select('*').order('created_at', { ascending: true }),
    ]);

    if (postsRes.error && likesRes.error && commentsRes.error) {
      return null;
    }

    const likes = (likesRes.data || []).map((r) => normalizeSupabaseLike(r as Record<string, unknown>, usersMap));
    const comments = (commentsRes.data || []).map((r) => normalizeSupabaseComment(r as Record<string, unknown>, usersMap));
    const posts = (postsRes.data || []).map((r) => {
      const normalized = normalizeSupabasePost(r as Record<string, unknown>, usersMap);
      // Ensure counts stay accurate relative to rows fetched
      const actualLikes = likes.filter((l) => l.post_id === normalized.id).length;
      const actualComments = comments.filter((c) => c.post_id === normalized.id).length;
      return {
        ...normalized,
        likes_count: Math.max(normalized.likes_count, actualLikes),
        comments_count: Math.max(normalized.comments_count, actualComments),
      };
    });

    return { posts, likes, comments };
  } catch (err) {
    console.warn('Supabase feed fetch fallback:', err);
    return null;
  }
}

export function subscribeFeedSupabaseRealtime(handlers: {
  onRefreshNeeded: () => void;
}): () => void {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const channel = supabase
    .channel('nobarkuy-feed-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'posts' },
      () => handlers.onRefreshNeeded()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'comments' },
      () => handlers.onRefreshNeeded()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'likes' },
      () => handlers.onRefreshNeeded()
    )
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}
