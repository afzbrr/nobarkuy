import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { ALL_BORDERS, getBorderById } from '../data/borders';
import { FeedPost, FeedComment, UserProfile } from '../types';
import { filterKataKasar, formatRelativeTime, processImageFile } from '../lib/feedHelpers';
import { isOwnerUsername } from '../lib/telegram';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Plus,
  Image as ImageIcon,
  Trash2,
  Flag,
  Pin,
  Ban,
  Palette,
  Send,
  Reply,
  X,
  User as UserIcon,
  Sparkles,
  Check,
} from 'lucide-react';

const FEED_TAGS = ['Nobar', 'Review Film', 'Meme', 'Rekomendasi', 'Curhat', 'Flexing Border'];

export const CommunityFeed: React.FC = () => {
  const {
    currentUser,
    allUsers,
    isOwner,
    posts,
    feedLikes,
    feedComments,
    userOwnedBorders,
    createPost,
    deletePost,
    toggleLikePost,
    addPostComment,
    deletePostComment,
    toggleLikeComment,
    reportPost,
    togglePinPost,
    toggleBanUser,
    buyShopBorder,
    equipBorder,
    setActiveTab,
    setIsTransferModalOpen,
    setTransferRecipient,
    setToast,
  } = useApp();

  const [feedTab, setFeedTab] = useState<'terbaru' | 'terpopuler'>('terbaru');

  // Create Post Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [postImageUrl, setPostImageUrl] = useState('');
  const [postCaption, setPostCaption] = useState('');
  const [postTag, setPostTag] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals & Interactive States
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<string | null>(null);
  const [likesModalPostId, setLikesModalPostId] = useState<string | null>(null);
  const [commentsModalPostId, setCommentsModalPostId] = useState<string | null>(null);
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ id: string; nama: string } | null>(null);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [borderModalId, setBorderModalId] = useState<string | null>(null);
  const [profileModalUserId, setProfileModalUserId] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const todayKey = new Date().toISOString().split('T')[0];
  const myTodayPostCount = useMemo(
    () => posts.filter((p) => p.user_id === currentUser.user_id && p.created_at.startsWith(todayKey)).length,
    [posts, currentUser.user_id, todayKey]
  );
  const remainingPostsToday = Math.max(0, 3 - myTodayPostCount);

  const visiblePosts = useMemo(() => {
    const filtered = posts.filter((p) => !p.is_hidden && p.reports_count < 3);
    return [...filtered].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      if (feedTab === 'terpopuler') {
        const scoreA = (a.likes_count || 0) * 2 + (a.comments_count || 0);
        const scoreB = (b.likes_count || 0) * 2 + (b.comments_count || 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [posts, feedTab]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCreateError(null);
    if (!file) return;
    if (file.type.startsWith('video/')) {
      setCreateError('Feed cuma buat foto aja ya, jangan upload video!');
      return;
    }
    try {
      const processed = await processImageFile(file);
      setPostImageUrl(processed);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Gagal memproses foto!');
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!postImageUrl && !postCaption.trim()) {
      setCreateError('Isi teks atau pilih foto dulu buat diposting!');
      return;
    }
    if (!isOwner && remainingPostsToday <= 0) {
      setCreateError('Batas maksimal 3 post per hari udah habis! Besok lagi ya.');
      return;
    }
    setIsSubmittingPost(true);
    const res = await createPost(postImageUrl, postCaption, postTag);
    setIsSubmittingPost(false);
    if (res.success) {
      setIsCreateOpen(false);
      setPostImageUrl('');
      setPostCaption('');
      setPostTag('');
    } else {
      setCreateError(res.message);
    }
  };

  const handleSharePost = async (post: FeedPost) => {
    const tagSuffix = post.tag ? ` (${post.tag})` : '';
    const shareText = `${post.nama} (@${post.username}) di NOBAR KUY: "${filterKataKasar(post.caption)}"${tagSuffix}`;
    const appUrl = window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'NOBAR KUY Feed', text: shareText, url: appUrl });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${appUrl}`);
        setToast('Link postingan disalin ke clipboard!');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${appUrl}`);
        setToast('Link postingan disalin!');
      } catch {
        // ignore
      }
    }
  };

  const resolveUserSnapshot = (
    uid: string,
    fallback: { nama: string; username: string; foto_profil: string; border: string; custom_text?: string }
  ) => {
    const found = allUsers.find((u) => u.user_id === uid);
    return {
      nama: found?.nama || fallback.nama,
      username: found?.username || fallback.username,
      foto: found?.foto || fallback.foto_profil,
      border: found?.border_saat_ini || fallback.border,
      custom_text: found?.custom_text ?? fallback.custom_text,
      decorations: found?.decorations,
      is_banned: found?.is_banned,
    };
  };

  const openUserProfileModal = (uid: string) => {
    setProfileModalUserId(uid);
  };

  const startCommentLongPress = (commentId: string, canDelete: boolean) => {
    if (!canDelete) return;
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => {
      setConfirmDeleteCommentId(commentId);
    }, 550);
  };

  const cancelCommentLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const activeCommentsPost = commentsModalPostId
    ? posts.find((p) => p.id === commentsModalPostId) || null
    : null;

  const activeLikesList = likesModalPostId
    ? feedLikes.filter((l) => l.post_id === likesModalPostId)
    : [];

  const inspectedBorder = borderModalId ? getBorderById(borderModalId) || ALL_BORDERS[0] : null;
  const inspectedUser: UserProfile | null = profileModalUserId
    ? allUsers.find((u) => u.user_id === profileModalUserId) || null
    : null;

  return (
    <div className="space-y-3 pt-1">
      {/* FEED HEADER & TABS: Terbaru | Terpopuler + Buat Post */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#141414] border border-[#242424]">
          <button
            type="button"
            onClick={() => setFeedTab('terbaru')}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-colors ${
              feedTab === 'terbaru'
                ? 'bg-white text-black shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Terbaru
          </button>
          <button
            type="button"
            onClick={() => setFeedTab('terpopuler')}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-colors ${
              feedTab === 'terpopuler'
                ? 'bg-white text-black shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Terpopuler
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (currentUser.is_banned) {
              setToast('Akun lu lagi di-banned Owner, gabisa posting!');
              return;
            }
            setCreateError(null);
            setIsCreateOpen(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] via-[#FF2D55] to-[#7C3AED] hover:opacity-95 text-white font-heading font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Buat Post</span>
        </button>
      </div>

      {currentUser.is_banned && (
        <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-300 font-semibold text-center">
          🚫 Akun lu lagi di-banned Owner. Lu gabisa bikin post, like, atau komentar.
        </div>
      )}

      {/* FEED POSTS LIST */}
      {visiblePosts.length === 0 ? (
        <div className="rounded-2xl bg-[#141414] border border-[#222] py-10 px-4 text-center">
          <div className="w-11 h-11 mx-auto rounded-2xl bg-[#1B1B1B] border border-[#2A2A2A] flex items-center justify-center text-[#D4AF37] mb-2.5">
            <ImageIcon className="w-5 h-5" />
          </div>
          <h4 className="font-heading font-bold text-sm text-white">Belum ada postingan</h4>
          <p className="text-[11px] text-stone-400 mt-1 mb-3">
            Jadilah yang pertama share momen seru nobar lu di sini!
          </p>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-white text-black font-heading font-bold text-xs"
          >
            + Buat Post Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {visiblePosts.map((post) => {
            const author = resolveUserSnapshot(post.user_id, post);
            const postLikes = feedLikes.filter((l) => l.post_id === post.id);
            const postComments = feedComments.filter((c) => c.post_id === post.id);
            const iLiked = postLikes.some((l) => l.user_id === currentUser.user_id);
            const likesCount = Math.max(postLikes.length, post.likes_count || 0);
            const commentsCount = Math.max(postComments.length, post.comments_count || 0);
            const canDelete = post.user_id === currentUser.user_id || isOwner;
            const authorBorder = getBorderById(author.border);
            const filteredCaption = filterKataKasar(post.caption);
            const previewComment = postComments[postComments.length - 1];

            return (
              <article
                key={post.id}
                className="rounded-2xl bg-[#141414] border border-[#242424] overflow-hidden shadow-md relative"
              >
                {/* Pinned indicator */}
                {post.is_pinned && (
                  <div className="px-3.5 py-1 bg-[#D4AF37]/15 border-b border-[#D4AF37]/25 flex items-center gap-1.5 text-[10px] font-heading font-bold text-[#D4AF37]">
                    <Pin className="w-3 h-3" />
                    <span>DISEMATKAN OWNER</span>
                  </div>
                )}

                {/* 1. HEADER: Foto profil, nama, waktu posting, tombol titik tiga */}
                <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openUserProfileModal(post.user_id)}
                    className="flex items-center gap-2.5 min-w-0 text-left group"
                  >
                    <UserAvatar
                      foto={author.foto}
                      nama={author.nama}
                      borderId={author.border}
                      customText={author.custom_text}
                      decorations={author.decorations}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-heading font-bold text-xs text-white truncate group-hover:text-[#D4AF37] transition-colors">
                          {author.nama}
                        </span>
                        {isOwnerUsername(author.username) && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-[#D4AF37] text-black shrink-0">
                            OWNER
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-400 truncate">
                        @{author.username} • {formatRelativeTime(post.created_at)}
                      </div>
                    </div>
                  </button>

                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)
                      }
                      className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-[#1F1F1F]"
                      title="Opsi Postingan"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {openMenuPostId === post.id && (
                      <div className="absolute right-0 top-8 w-48 rounded-xl bg-[#1A1A1A] border border-[#2F2F2F] shadow-2xl z-30 py-1 text-xs overflow-hidden">
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPostId(null);
                              setConfirmDeletePostId(post.id);
                            }}
                            className="w-full px-3 py-2 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Postingan</span>
                          </button>
                        )}
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPostId(null);
                              togglePinPost(post.id);
                            }}
                            className="w-full px-3 py-2 text-left text-[#D4AF37] hover:bg-white/5 flex items-center gap-2 font-semibold"
                          >
                            <Pin className="w-3.5 h-3.5" />
                            <span>{post.is_pinned ? 'Lepas Pin' : 'Pin Postingan'}</span>
                          </button>
                        )}
                        {isOwner && !isOwnerUsername(author.username) && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPostId(null);
                              toggleBanUser(post.user_id);
                            }}
                            className="w-full px-3 py-2 text-left text-amber-400 hover:bg-white/5 flex items-center gap-2 font-semibold"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>{author.is_banned ? 'Cabut Ban User' : 'Banned User'}</span>
                          </button>
                        )}
                        {post.user_id !== currentUser.user_id && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPostId(null);
                              reportPost(post.id);
                            }}
                            className="w-full px-3 py-2 text-left text-stone-300 hover:bg-white/5 flex items-center gap-2"
                          >
                            <Flag className="w-3.5 h-3.5 text-rose-400" />
                            <span>Report Postingan</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. FOTO UTUH (jika ada): object-fit: contain, width: 100%, height: auto, max-height: 500px, background hitam, di tengah */}
                {post.image_url ? (
                  <div className="w-full bg-black flex items-center justify-center">
                    <img
                      src={post.image_url}
                      alt={filteredCaption || 'Foto Postingan'}
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '500px',
                        objectFit: 'contain',
                        display: 'block',
                        margin: '0 auto',
                        backgroundColor: '#000000',
                      }}
                    />
                  </div>
                ) : (
                  filteredCaption && (
                    <div className="px-3.5 py-2">
                      <p className="text-[13px] text-stone-100 leading-relaxed whitespace-pre-wrap break-words">
                        {filteredCaption}
                      </p>
                    </div>
                  )
                )}

                {/* 3. ACTIONS ROW: Like, Komen, Share, Beli Border Ini */}
                <div className="px-3.5 pt-3 pb-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleLikePost(post.id)}
                        className={`transition-transform active:scale-125 ${
                          iLiked ? 'text-rose-500' : 'text-stone-300 hover:text-rose-400'
                        }`}
                        title={iLiked ? 'Batal Like' : 'Like'}
                      >
                        <Heart className={`w-5 h-5 ${iLiked ? 'fill-rose-500' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setLikesModalPostId(post.id)}
                        className="text-xs font-heading font-bold text-stone-200 hover:text-[#D4AF37] transition-colors"
                        title="Lihat siapa aja yang like"
                      >
                        {likesCount}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setReplyTarget(null);
                        setCommentsModalPostId(post.id);
                      }}
                      className="flex items-center gap-1.5 text-stone-300 hover:text-white transition-colors"
                      title="Lihat & Tulis Komentar"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-xs font-heading font-bold">{commentsCount}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSharePost(post)}
                      className="text-stone-300 hover:text-white transition-colors"
                      title="Bagikan Postingan"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tombol Beli Border Ini */}
                  {authorBorder && authorBorder.id !== 'pemula' && (
                    <button
                      type="button"
                      onClick={() => setBorderModalId(authorBorder.id)}
                      className="px-2.5 py-1 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-heading font-bold flex items-center gap-1 shrink-0 transition-transform active:scale-95"
                    >
                      <Palette className="w-3 h-3" />
                      <span>Beli Border Ini</span>
                    </button>
                  )}
                </div>

                {/* Clickable likes summary link */}
                <div className="px-3.5 pb-1">
                  <button
                    type="button"
                    onClick={() => setLikesModalPostId(post.id)}
                    className="text-[11px] font-semibold text-stone-300 hover:text-[#D4AF37] transition-colors"
                  >
                    {likesCount > 0 ? `Disukai ${likesCount} orang • Lihat semua` : 'Lihat yang like'}
                  </button>
                </div>

                {/* 4. CAPTION & KATEGORI (TANPA HASHTAG) */}
                {(Boolean(post.image_url && filteredCaption) || Boolean(post.tag)) && (
                  <div className="px-3.5 pb-2 space-y-1.5">
                    {Boolean(post.image_url) && filteredCaption && (
                      <p className="text-xs text-stone-200 leading-relaxed whitespace-pre-wrap break-words">
                        <span className="font-heading font-bold text-white mr-1.5">
                          {author.nama}
                        </span>
                        {filteredCaption}
                      </p>
                    )}

                    {post.tag && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#1D1D1D] border border-[#2B2B2B] text-[10px] font-semibold text-[#D4AF37]">
                          {post.tag}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. LIHAT X KOMENTAR + LATEST COMMENT PREVIEW */}
                <div className="px-3.5 pb-3 pt-1 border-t border-[#1F1F1F]">
                  {previewComment && (
                    <div
                      onClick={() => {
                        setReplyTarget(null);
                        setCommentsModalPostId(post.id);
                      }}
                      className="text-[11px] text-stone-300 mb-1.5 line-clamp-1 cursor-pointer"
                    >
                      <span className="font-bold text-white mr-1.5">{previewComment.nama}</span>
                      <span>{filterKataKasar(previewComment.isi)}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setReplyTarget(null);
                      setCommentsModalPostId(post.id);
                    }}
                    className="text-[11px] text-stone-400 hover:text-white font-medium"
                  >
                    {commentsCount > 0
                      ? `Lihat ${commentsCount} komentar`
                      : 'Tulis komentar pertama...'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* MODAL 1: BUAT POST (UPLOAD FOTO + CAPTION + TAG, MAX 3/HARI, ZERO COIN) */}
      {isCreateOpen && (
        <div
          onClick={() => setIsCreateOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-[#141414] border border-[#2A2A2A] p-4 shadow-2xl max-h-[88vh] overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#222] mb-3">
              <div>
                <h4 className="font-heading font-bold text-sm text-white">Buat Postingan Baru</h4>
                <p className="text-[10px] text-stone-400">
                  {isOwner
                    ? 'Tulis teks atau upload foto buat komunitas (Owner)'
                    : `Sisa kuota hari ini: ${remainingPostsToday}/3 post`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg bg-[#1F1F1F] text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPost} className="space-y-3 text-xs">
              {/* Photo picker (optional!) & untouched preview */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {postImageUrl ? (
                <div className="relative rounded-xl overflow-hidden bg-black border border-[#2A2A2A]">
                  <img
                    src={postImageUrl}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      display: 'block',
                      margin: '0 auto',
                      backgroundColor: '#000000',
                    }}
                  />
                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPostImageUrl('')}
                      className="px-2.5 py-1 rounded-lg bg-rose-950/90 border border-rose-500/40 text-rose-200 text-[10px] font-semibold"
                    >
                      Hapus Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-black/80 border border-white/20 text-white text-[10px] font-semibold"
                    >
                      Ganti Foto
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 rounded-xl bg-[#191919] hover:bg-[#1F1F1F] border border-dashed border-[#363636] flex flex-col items-center justify-center gap-1.5 text-stone-400"
                >
                  <ImageIcon className="w-6 h-6 text-[#D4AF37]" />
                  <span className="font-semibold text-white">Tambah Foto (Opsional)</span>
                  <span className="text-[10px] text-stone-500">
                    Bisa posting teks aja atau tambah foto dari galeri
                  </span>
                </button>
              )}

              <div>
                <label className="text-[11px] font-medium text-stone-300 block mb-1">Teks / Caption</label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  placeholder="Tulis cerita, curhat, atau review nobar lu di sini..."
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-300 block mb-1">Kategori (Opsional)</label>
                <div className="flex flex-wrap gap-1.5">
                  {FEED_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setPostTag(postTag === tag ? '' : tag)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border transition-colors ${
                        postTag === tag
                          ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                          : 'bg-[#1A1A1A] text-stone-300 border-[#282828]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {createError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px]">
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="py-2.5 rounded-xl bg-[#222] text-stone-400 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPost}
                  className="py-2.5 rounded-xl bg-white hover:bg-stone-200 disabled:opacity-40 text-black font-heading font-bold"
                >
                  {isSubmittingPost ? 'Mengirim...' : 'Posting Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: KONFIRMASI HAPUS POSTINGAN */}
      {confirmDeletePostId && (
        <div
          onClick={() => setConfirmDeletePostId(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-2xl bg-[#141414] border border-[#2C2C2C] p-4 shadow-2xl text-center space-y-3"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="font-heading font-bold text-sm text-white">
              Yakin mau hapus postingan ini?
            </h4>
            <p className="text-[11px] text-stone-400">
              Postingan beserta semua like &amp; komentarnya bakal langsung hilang dari semua user.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDeletePostId(null)}
                className="py-2 rounded-xl bg-[#222] text-stone-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = confirmDeletePostId;
                  setConfirmDeletePostId(null);
                  await deletePost(id);
                }}
                className="py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-heading font-bold"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: LIST USER YANG LIKE POSTINGAN */}
      {likesModalPostId && (
        <div
          onClick={() => setLikesModalPostId(null)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/80 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-[#141414] border border-[#2B2B2B] p-4 shadow-2xl flex flex-col max-h-[75vh]"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#222] shrink-0">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <h4 className="font-heading font-bold text-xs text-white">
                  Disukai Oleh ({activeLikesList.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setLikesModalPostId(null)}
                className="p-1 rounded-lg bg-[#1F1F1F] text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2.5 space-y-2 no-scrollbar">
              {activeLikesList.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500">
                  Belum ada yang like postingan ini.
                </div>
              ) : (
                activeLikesList.map((like) => {
                  const uSnap = resolveUserSnapshot(like.user_id, like);
                  return (
                    <div
                      key={like.id}
                      className="p-2.5 rounded-xl bg-[#181818] border border-[#242424] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                          foto={uSnap.foto}
                          nama={uSnap.nama}
                          borderId={uSnap.border}
                          decorations={uSnap.decorations}
                          size="xs"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{uSnap.nama}</div>
                          <div className="text-[10px] text-stone-400 truncate">
                            @{uSnap.username}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setLikesModalPostId(null);
                          openUserProfileModal(like.user_id);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#232323] hover:bg-[#2E2E2E] border border-[#333] text-[10px] font-heading font-bold text-[#D4AF37] shrink-0"
                      >
                        Lihat Profil
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: HALAMAN KOMENTAR LENGKAP + REPLY + LIKE KOMEN + HAPUS KOMEN */}
      {activeCommentsPost && (() => {
        const allPostComments = feedComments.filter((c) => c.post_id === activeCommentsPost.id);
        const topLevel = allPostComments.filter((c) => !c.parent_id);
        const repliesByParent = new Map<string, FeedComment[]>();
        allPostComments
          .filter((c) => Boolean(c.parent_id))
          .forEach((r) => {
            const pid = String(r.parent_id);
            const arr = repliesByParent.get(pid) || [];
            arr.push(r);
            repliesByParent.set(pid, arr);
          });

        const renderCommentRow = (cmt: FeedComment, isReply = false) => {
          const uSnap = resolveUserSnapshot(cmt.user_id, cmt);
          const likedByMe = (cmt.liked_by || []).includes(currentUser.user_id);
          const likesNum = Math.max((cmt.liked_by || []).length, cmt.likes_count || 0);
          const canDeleteComment =
            cmt.user_id === currentUser.user_id ||
            activeCommentsPost.user_id === currentUser.user_id ||
            isOwner;

          return (
            <div
              key={cmt.id}
              onTouchStart={() => startCommentLongPress(cmt.id, canDeleteComment)}
              onTouchEnd={cancelCommentLongPress}
              onTouchCancel={cancelCommentLongPress}
              onMouseDown={() => startCommentLongPress(cmt.id, canDeleteComment)}
              onMouseUp={cancelCommentLongPress}
              onMouseLeave={cancelCommentLongPress}
              className={`flex items-start gap-2.5 p-2 rounded-xl bg-[#181818] border border-[#232323] ${
                isReply ? 'ml-7 bg-[#151515]' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => openUserProfileModal(cmt.user_id)}
                className="shrink-0 mt-0.5"
              >
                <UserAvatar
                  foto={uSnap.foto}
                  nama={uSnap.nama}
                  borderId={uSnap.border}
                  decorations={uSnap.decorations}
                  size="xs"
                />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => openUserProfileModal(cmt.user_id)}
                      className="text-[11px] font-heading font-bold text-white truncate hover:text-[#D4AF37]"
                    >
                      {uSnap.nama}
                    </button>
                    <span className="text-[9.5px] text-stone-500 shrink-0">
                      {formatRelativeTime(cmt.created_at)}
                    </span>
                  </div>

                  {canDeleteComment && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteCommentId(cmt.id)}
                      className="p-1 rounded-md text-stone-500 hover:text-rose-400 shrink-0"
                      title="Hapus Komentar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-stone-200 mt-0.5 leading-snug break-words">
                  {cmt.reply_to_nama && (
                    <span className="text-[#D4AF37] font-semibold mr-1">
                      @{cmt.reply_to_nama}
                    </span>
                  )}
                  {filterKataKasar(cmt.isi)}
                </p>

                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-stone-400">
                  <button
                    type="button"
                    onClick={() => toggleLikeComment(cmt.id)}
                    className={`flex items-center gap-1 font-semibold ${
                      likedByMe ? 'text-rose-400' : 'hover:text-white'
                    }`}
                  >
                    <Heart className={`w-3 h-3 ${likedByMe ? 'fill-rose-400' : ''}`} />
                    <span>{likesNum > 0 ? likesNum : 'Suka'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setReplyTarget({ id: cmt.parent_id || cmt.id, nama: uSnap.username || uSnap.nama })
                    }
                    className="flex items-center gap-1 hover:text-[#D4AF37] font-semibold"
                  >
                    <Reply className="w-3 h-3" />
                    <span>Balas</span>
                  </button>
                </div>
              </div>
            </div>
          );
        };

        return (
          <div
            onClick={() => setCommentsModalPostId(null)}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 bg-black/80 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-[#131313] border border-[#2B2B2B] shadow-2xl flex flex-col h-[78vh]"
            >
              <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#D4AF37]" />
                  <h4 className="font-heading font-bold text-xs text-white">
                    Komentar ({allPostComments.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setCommentsModalPostId(null)}
                  className="p-1 rounded-lg bg-[#1F1F1F] text-stone-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
                {allPostComments.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-stone-500">
                    Belum ada komentar. Mulai obrolan yuk!
                  </div>
                ) : (
                  topLevel.map((cmt) => (
                    <div key={cmt.id} className="space-y-1.5">
                      {renderCommentRow(cmt, false)}
                      {(repliesByParent.get(cmt.id) || []).map((rep) => renderCommentRow(rep, true))}
                    </div>
                  ))
                )}
              </div>

              {/* Sticky comment input */}
              <div className="p-3 border-t border-[#222] bg-[#111] shrink-0 space-y-2">
                {replyTarget && (
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#1A1A1A] border-l-2 border-[#D4AF37] text-[10.5px]">
                    <span className="text-stone-300">
                      Membalas <strong className="text-[#D4AF37]">@{replyTarget.nama}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setReplyTarget(null)}
                      className="text-stone-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!commentInput.trim() || isSendingComment) return;
                    setIsSendingComment(true);
                    const res = await addPostComment(
                      activeCommentsPost.id,
                      commentInput.trim(),
                      replyTarget?.id || null,
                      replyTarget?.nama || null
                    );
                    setIsSendingComment(false);
                    if (res.success) {
                      setCommentInput('');
                      setReplyTarget(null);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder={
                      replyTarget
                        ? `Balas @${replyTarget.nama}...`
                        : 'Tulis komentar lu...'
                    }
                    className="flex-1 bg-[#1A1A1A] border border-[#292929] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="submit"
                    disabled={!commentInput.trim() || isSendingComment}
                    className="w-9 h-9 rounded-xl bg-white hover:bg-stone-200 disabled:opacity-40 text-black flex items-center justify-center shrink-0"
                  >
                    <Send className="w-4 h-4 text-black" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 5: KONFIRMASI HAPUS KOMENTAR */}
      {confirmDeleteCommentId && (
        <div
          onClick={() => setConfirmDeleteCommentId(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-2xl bg-[#141414] border border-[#2C2C2C] p-4 shadow-2xl text-center space-y-3"
          >
            <h4 className="font-heading font-bold text-sm text-white">
              Yakin mau hapus komentar ini?
            </h4>
            <p className="text-[11px] text-stone-400">
              Komentar bakal langsung kehapus di semua HP secara realtime.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteCommentId(null)}
                className="py-2 rounded-xl bg-[#222] text-stone-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = confirmDeleteCommentId;
                  setConfirmDeleteCommentId(null);
                  await deletePostComment(id);
                }}
                className="py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-heading font-bold"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: BELI BORDER INI */}
      {inspectedBorder && (
        <div
          onClick={() => setBorderModalId(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-2xl bg-[#141414] border border-[#2C2C2C] p-4 shadow-2xl text-center space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                Detail Border
              </span>
              <button
                type="button"
                onClick={() => setBorderModalId(null)}
                className="p-1 rounded-lg bg-[#1F1F1F] text-stone-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="py-2 flex justify-center">
              <UserAvatar
                foto={currentUser.foto}
                nama={currentUser.nama}
                borderId={inspectedBorder.id}
                size="xl"
              />
            </div>

            <div>
              <h4 className="font-heading font-extrabold text-sm text-white">
                {inspectedBorder.nama}
              </h4>
              <p className="text-[11px] text-stone-400 mt-0.5">{inspectedBorder.deskripsi}</p>
              <div className="mt-2 inline-block px-2.5 py-1 rounded-lg bg-[#1C1C1C] border border-[#2B2B2B] text-[10.5px] font-semibold text-[#D4AF37]">
                {inspectedBorder.hargaCoin
                  ? `Harga: 🪙 ${inspectedBorder.hargaCoin.toLocaleString('id-ID')} Coin`
                  : inspectedBorder.syarat}
              </div>
            </div>

            {userOwnedBorders.includes(inspectedBorder.id) ? (
              <button
                type="button"
                onClick={async () => {
                  await equipBorder(inspectedBorder.id);
                  setBorderModalId(null);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Udah Punya • Pasang Sekarang</span>
              </button>
            ) : inspectedBorder.hargaCoin ? (
              <button
                type="button"
                onClick={async () => {
                  const res = await buyShopBorder(inspectedBorder.id);
                  if (res.success) setBorderModalId(null);
                }}
                className="w-full py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c5a030] text-black font-heading font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  Beli Border ({isOwner ? 'Gratis Owner' : `${inspectedBorder.hargaCoin} Coin`})
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setBorderModalId(null);
                  setActiveTab('border');
                }}
                className="w-full py-2.5 rounded-xl bg-white text-black font-heading font-bold text-xs"
              >
                Lihat di Menu Border Saya
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODAL 7: LIHAT PROFIL USER */}
      {inspectedUser && (
        <div
          onClick={() => setProfileModalUserId(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-2xl bg-[#141414] border border-[#2C2C2C] p-4 shadow-2xl text-center space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-400 uppercase flex items-center gap-1">
                <UserIcon className="w-3 h-3 text-[#D4AF37]" />
                Profil Pengguna
              </span>
              <button
                type="button"
                onClick={() => setProfileModalUserId(null)}
                className="p-1 rounded-lg bg-[#1F1F1F] text-stone-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="py-1 flex justify-center">
              <UserAvatar
                foto={inspectedUser.foto}
                nama={inspectedUser.nama}
                borderId={inspectedUser.border_saat_ini}
                customText={inspectedUser.custom_text}
                showCustomText={true}
                decorations={inspectedUser.decorations}
                size="xl"
              />
            </div>

            <div>
              <h4 className="font-heading font-black text-base text-white">
                {inspectedUser.nama}
              </h4>
              <p className="text-xs text-[#D4AF37]">@{inspectedUser.username}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-[#1A1A1A] border border-[#242424]">
                <div className="text-[10px] text-stone-400">Total Nobar</div>
                <div className="font-heading font-bold text-white">
                  {inspectedUser.total_nonton}x
                </div>
              </div>
              <div className="p-2 rounded-xl bg-[#1A1A1A] border border-[#242424]">
                <div className="text-[10px] text-stone-400">Poin</div>
                <div className="font-heading font-bold text-white">
                  {inspectedUser.poin.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {inspectedUser.user_id !== currentUser.user_id && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTransferRecipient(inspectedUser);
                    setProfileModalUserId(null);
                    setIsTransferModalOpen(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-stone-200 text-black font-heading font-bold text-xs"
                >
                  Transfer Coin
                </button>
                {isOwner && !isOwnerUsername(inspectedUser.username) && (
                  <button
                    type="button"
                    onClick={() => toggleBanUser(inspectedUser.user_id)}
                    className="px-3 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/35 text-rose-300 font-heading font-bold text-xs"
                  >
                    {inspectedUser.is_banned ? 'Unban' : 'Ban'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
