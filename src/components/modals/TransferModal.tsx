import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../UserAvatar';
import { X, Send, AlertCircle } from 'lucide-react';

export const TransferModal: React.FC = () => {
  const {
    isTransferModalOpen,
    setIsTransferModalOpen,
    transferRecipient,
    setTransferRecipient,
    allUsers,
    currentUser,
    isOwner,
    transferCoin,
  } = useApp();

  const [selectedUserId, setSelectedUserId] = useState<string>(transferRecipient?.user_id || '');
  const [amountStr, setAmountStr] = useState<string>('50');
  const [note, setNote] = useState<string>('Nih buat hias border lu!');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isTransferModalOpen) {
      setSelectedUserId(transferRecipient?.user_id || '');
      setErrorText(null);
    }
  }, [isTransferModalOpen, transferRecipient]);

  if (!isTransferModalOpen) return null;

  const eligibleRecipients = allUsers.filter((u) => u.user_id !== currentUser.user_id);
  const activeRecipient =
    allUsers.find((u) => u.user_id === selectedUserId) || transferRecipient || eligibleRecipients[0];

  const handleTransfer = async () => {
    setErrorText(null);
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) {
      setErrorText('Masukin angka Coin yang valid ya!');
      return;
    }
    if (amount < 10) {
      setErrorText('Minimal transfer 10 Coin bro!');
      return;
    }
    if (!isOwner && amount > 1000) {
      setErrorText('Maksimal transfer 1000 Coin per hari!');
      return;
    }
    if (!isOwner && currentUser.coin < amount) {
      setErrorText('Coin lu kurang!');
      return;
    }
    if (!activeRecipient) {
      setErrorText('Belum ada temen lain yang terdaftar buat dikirim Coin!');
      return;
    }

    setSubmitting(true);
    const res = await transferCoin(activeRecipient.user_id, amount, note);
    setSubmitting(false);

    if (res.success) {
      setIsTransferModalOpen(false);
      setTransferRecipient(null);
    } else {
      setErrorText(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-[#141414] border border-[#262626] p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪙</span>
            <h3 className="font-heading font-bold text-base text-white">Transfer Coin</h3>
          </div>
          <button
            onClick={() => {
              setIsTransferModalOpen(false);
              setTransferRecipient(null);
            }}
            className="w-8 h-8 rounded-lg bg-[#1E1E1E] text-stone-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recipient Picker */}
        <div className="mt-4">
          <label className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block mb-1.5">
            Penerima Coin
          </label>
          {eligibleRecipients.length === 0 ? (
            <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-xs text-stone-400 text-center">
              Belum ada pengguna lain yang gabung NOBAR KUY.
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
              {activeRecipient && (
                <>
                  <UserAvatar
                    foto={activeRecipient.foto}
                    nama={activeRecipient.nama}
                    borderId={activeRecipient.border_saat_ini}
                    decorations={activeRecipient.decorations}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-white truncate">{activeRecipient.nama}</div>
                    <div className="text-[10px] text-stone-400 font-normal">@{activeRecipient.username}</div>
                  </div>
                </>
              )}

              <select
                value={activeRecipient?.user_id || ''}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="bg-[#242424] text-stone-300 text-xs rounded-lg px-2 py-1 border border-[#333] focus:outline-none focus:border-[#D4AF37]"
              >
                {eligibleRecipients.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.nama} (@{u.username})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Input Amount */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">
              Jumlah Coin
            </label>
            <span className="text-[11px] text-stone-400">
              Saldo Lu: <strong className="text-white">{isOwner ? '∞' : currentUser.coin.toLocaleString('id-ID')}</strong>
            </span>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm">🪙</span>
            <input
              type="number"
              min="10"
              max={isOwner ? undefined : '1000'}
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="Contoh: 100"
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl pl-9 pr-3 py-2.5 text-sm font-heading font-bold text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>

          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {[10, 50, 100, 250].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmountStr(String(val))}
                className="py-1 rounded-lg bg-[#222] hover:bg-[#2A2A2A] text-[11px] font-semibold text-stone-300 transition-colors"
              >
                +{val}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1.5">
            <span>Min: 10 Coin</span>
            <span>{isOwner ? 'Owner: Unlimited' : 'Max: 1.000 Coin / hari'}</span>
            <span>Fee: 0 Coin (Gratis)</span>
          </div>
        </div>

        {/* Input Note */}
        <div className="mt-3">
          <label className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block mb-1">
            Pesan Buat Penerima (Opsional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nih buat hias border lu!"
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        {errorText && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorText}</span>
          </div>
        )}

        <button
          disabled={submitting || eligibleRecipients.length === 0}
          onClick={handleTransfer}
          className="mt-5 w-full py-3 rounded-xl bg-white hover:bg-stone-200 disabled:opacity-40 text-black font-heading font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
        >
          <Send className="w-4 h-4 text-black" />
          {submitting ? 'Mengirim...' : 'Kirim Coin Sekarang'}
        </button>
      </div>
    </div>
  );
};
