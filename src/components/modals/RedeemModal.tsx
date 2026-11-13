import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Ticket, Sparkles } from 'lucide-react';

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RedeemModal: React.FC<RedeemModalProps> = ({ isOpen, onClose }) => {
  const { redeemCode } = useApp();
  const [code, setCode] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRedeem = async () => {
    setStatusMsg(null);
    if (!code.trim()) {
      setStatusMsg({ text: 'Ketik kodenya dulu bro!', isError: true });
      return;
    }

    setSubmitting(true);
    const res = await redeemCode(code);
    setSubmitting(false);

    if (res.success) {
      setCode('');
      setStatusMsg({ text: res.message, isError: false });
      setTimeout(() => {
        onClose();
      }, 1600);
    } else {
      setStatusMsg({ text: res.message, isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-sm rounded-2xl bg-[#141414] border border-[#262626] p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="font-heading font-bold text-base text-white">Redeem Kode</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1E1E1E] text-stone-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-stone-400 mt-3 leading-relaxed">
          Masukin kode hadiah resmi dari Owner Faiz biar dapet Coin Gratis atau Border Langka!
        </p>

        <div className="mt-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="KETIK KODE REDEEM..."
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm font-heading font-bold uppercase tracking-wider text-white text-center focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
        </div>

        {statusMsg && (
          <div
            className={`mt-3 p-2.5 rounded-xl text-xs text-center font-medium ${
              statusMsg.isError
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        <button
          disabled={submitting}
          onClick={handleRedeem}
          className="mt-4 w-full py-3 rounded-xl bg-white hover:bg-stone-200 disabled:opacity-50 text-black font-heading font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
        >
          <Sparkles className="w-4 h-4 text-black" />
          {submitting ? 'Memeriksa...' : 'Claim Kode'}
        </button>
      </div>
    </div>
  );
};
