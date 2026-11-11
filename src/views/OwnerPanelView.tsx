import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from '../components/UserAvatar';
import { ALL_BORDERS } from '../data/borders';
import { Broadcast } from '../types';
import {
  Gift,
  Zap,
  Ticket,
  Megaphone,
  BarChart3,
  Users,
  Film,
  Coins,
  ArrowLeft,
  Sparkles,
  Send,
  Plus,
  TrendingUp,
} from 'lucide-react';

export const OwnerPanelView: React.FC = () => {
  const {
    isOwner,
    setActiveTab,
    createGiveaway,
    createFlashSale,
    createRedeemCode,
    createBroadcast,
    ownerGiveCoinToUser,
    allUsers,
    rooms,
    giveaways,
    flashSales,
    broadcasts,
  } = useApp();

  // If not owner, block
  if (!isOwner) {
    return (
      <div className="py-16 text-center select-none">
        <div className="text-4xl mb-3">🔒</div>
        <h3 className="font-heading font-bold text-lg text-white mb-2">Akses Ditolak</h3>
        <p className="text-xs text-stone-400 mb-4">
          Panel ini cuma bisa dibuka oleh Owner NOBAR KUY (Faiz).
        </p>
        <button
          onClick={() => setActiveTab('beranda')}
          className="px-4 py-2 rounded-xl bg-white text-black font-heading font-bold text-xs"
        >
          Balik ke Beranda
        </button>
      </div>
    );
  }

  // Active sub-panel
  const [panelSection, setPanelSection] = useState<'giveaway' | 'flash' | 'redeem' | 'broadcast' | 'stats'>('giveaway');

  // Form states
  // 1. Giveaway form
  const [gwPerOrang, setGwPerOrang] = useState(100);
  const [gwJumlahOrang, setGwJumlahOrang] = useState(50);
  const [gwDelay, setGwDelay] = useState(5);

  // 2. Flash Sale form
  const [fsBorderId, setFsBorderId] = useState('naga');
  const [fsHarga, setFsHarga] = useState(100);
  const [fsStok, setFsStok] = useState(5);
  const [fsDelay, setFsDelay] = useState(10);

  // 3. Redeem form
  const [rdKode, setRdKode] = useState('');
  const [rdType, setRdType] = useState<'coin' | 'border'>('coin');
  const [rdValue, setRdValue] = useState<string | number>(100);
  const [rdQuota, setRdQuota] = useState(100);

  // 4. Broadcast form
  const [bcJenis, setBcJenis] = useState<Broadcast['jenis']>('popup');
  const [bcJudul, setBcJudul] = useState('');
  const [bcPesan, setBcPesan] = useState('');
  const [bcTarget, setBcTarget] = useState<Broadcast['target']>('all');

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#222]">
        <button
          onClick={() => setActiveTab('profil')}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-heading font-bold text-[10px]">
            👑 OWNER PANEL FAIZ
          </span>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-[#141414] rounded-2xl border border-[#222] text-xs">
        <button
          onClick={() => setPanelSection('giveaway')}
          className={`py-2 px-1 rounded-xl text-center ${
            panelSection === 'giveaway' ? 'bg-[#1E1E1E] text-[#D4AF37] font-bold' : 'text-stone-400'
          }`}
        >
          <Gift className="w-4 h-4 mx-auto mb-0.5" />
          <span className="text-[9px] block truncate">Bagi-bagi</span>
        </button>
        <button
          onClick={() => setPanelSection('flash')}
          className={`py-2 px-1 rounded-xl text-center ${
            panelSection === 'flash' ? 'bg-[#1E1E1E] text-rose-400 font-bold' : 'text-stone-400'
          }`}
        >
          <Zap className="w-4 h-4 mx-auto mb-0.5" />
          <span className="text-[9px] block truncate">Flash Sale</span>
        </button>
        <button
          onClick={() => setPanelSection('redeem')}
          className={`py-2 px-1 rounded-xl text-center ${
            panelSection === 'redeem' ? 'bg-[#1E1E1E] text-white font-bold' : 'text-stone-400'
          }`}
        >
          <Ticket className="w-4 h-4 mx-auto mb-0.5" />
          <span className="text-[9px] block truncate">Redeem</span>
        </button>
        <button
          onClick={() => setPanelSection('broadcast')}
          className={`py-2 px-1 rounded-xl text-center ${
            panelSection === 'broadcast' ? 'bg-[#1E1E1E] text-sky-400 font-bold' : 'text-stone-400'
          }`}
        >
          <Megaphone className="w-4 h-4 mx-auto mb-0.5" />
          <span className="text-[9px] block truncate">Broadcast</span>
        </button>
        <button
          onClick={() => setPanelSection('stats')}
          className={`py-2 px-1 rounded-xl text-center ${
            panelSection === 'stats' ? 'bg-[#1E1E1E] text-emerald-400 font-bold' : 'text-stone-400'
          }`}
        >
          <BarChart3 className="w-4 h-4 mx-auto mb-0.5" />
          <span className="text-[9px] block truncate">Statistik</span>
        </button>
      </div>

      {/* 1. BAGI-BAGI COIN */}
      {panelSection === 'giveaway' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-5">
            <h4 className="font-heading font-bold text-sm text-white mb-1">
              🎁 Buat Bagi-bagi Coin Gratis
            </h4>
            <p className="text-xs text-stone-400 mb-4">
              Banner countdown bakal muncul di Beranda semua pengguna.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-medium text-stone-300 block mb-1">
                  Coin per Orang
                </label>
                <input
                  type="number"
                  value={gwPerOrang}
                  onChange={(e) => setGwPerOrang(Number(e.target.value))}
                  className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-300 block mb-1">
                  Jumlah Kuota Orang
                </label>
                <input
                  type="number"
                  value={gwJumlahOrang}
                  onChange={(e) => setGwJumlahOrang(Number(e.target.value))}
                  className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-300 block mb-1">
                  Mulai Berapa Menit Lagi (0 = Langsung Mulai)
                </label>
                <input
                  type="number"
                  value={gwDelay}
                  onChange={(e) => setGwDelay(Number(e.target.value))}
                  className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#242424] text-[11px] text-stone-300">
                Total Koin Dibagikan: <strong className="text-[#D4AF37]">{(gwPerOrang * gwJumlahOrang).toLocaleString('id-ID')} Coin</strong>
              </div>

              <button
                onClick={() => createGiveaway(gwPerOrang, gwJumlahOrang, gwDelay)}
                className="w-full py-3 rounded-xl bg-white hover:bg-stone-200 text-black font-heading font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Gift className="w-4 h-4 text-black" />
                Gas Luncurkan Bagi-bagi!
              </button>
            </div>
          </div>

          {/* Active Giveaways */}
          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4 text-xs">
            <h5 className="font-heading font-bold text-white mb-2">Riwayat Bagi-bagi</h5>
            <div className="space-y-2">
              {giveaways.map((gw) => (
                <div key={gw.id} className="p-2.5 rounded-xl bg-[#181818] border border-[#222] flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white">{gw.per_orang} Coin x {gw.jumlah_orang} Orang</span>
                    <div className="text-[10px] text-stone-400">Terklaim: {gw.claims.length}/{gw.jumlah_orang}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    gw.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#222] text-stone-400'
                  }`}>
                    {gw.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. FLASH SALE BORDER */}
      {panelSection === 'flash' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-5">
            <h4 className="font-heading font-bold text-sm text-white mb-1">
              ⚡ Buat Flash Sale Border
            </h4>
            <p className="text-xs text-stone-400 mb-4">
              Diskon cepet-cepetan buat border langka toko.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-medium text-stone-300 block mb-1">
                  Pilih Border Flash Sale
                </label>
                <select
                  value={fsBorderId}
                  onChange={(e) => setFsBorderId(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
                >
                  <option value="naga">Border NAGA (Normal: 1.000 Coin)</option>
                  <option value="galaxy">Border GALAXY (Normal: 800 Coin)</option>
                  <option value="sultan">Border SULTAN (Normal: 1.500 Coin)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-300 block mb-1">
                  Harga Flash Sale (Coin)
                </label>
                <input
                  type="number"
                  value={fsHarga}
                  onChange={(e) => setFsHarga(Number(e.target.value))}
                  className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-300 block mb-1">
                  Stok Terbatas (Contoh: 5 Orang)
                </label>
                <input
                  type="number"
                  value={fsStok}
                  onChange={(e) => setFsStok(Number(e.target.value))}
                  className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-300 block mb-1">
                  Mulai Berapa Menit Lagi (0 = Langsung Mulai)
                </label>
                <input
                  type="number"
                  value={fsDelay}
                  onChange={(e) => setFsDelay(Number(e.target.value))}
                  className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <button
                onClick={() => createFlashSale(fsBorderId, fsHarga, fsStok, fsDelay)}
                className="w-full py-3 rounded-xl bg-white hover:bg-stone-200 text-black font-heading font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4 text-black" />
                Luncurkan Flash Sale!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. KODE REDEEM */}
      {panelSection === 'redeem' && (
        <div className="rounded-2xl bg-[#141414] border border-[#262626] p-5">
          <h4 className="font-heading font-bold text-sm text-white mb-1">
            🎟️ Buat Kode Hadiah / Redeem
          </h4>
          <p className="text-xs text-stone-400 mb-4">
            Share kode ini di channel Telegram atau story buat hadiah pengguna.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-medium text-stone-300 block mb-1">
                Kode Kupon (Uppercase)
              </label>
              <input
                type="text"
                value={rdKode}
                onChange={(e) => setRdKode(e.target.value.toUpperCase())}
                placeholder="CONTOH: FAIZKECE"
                className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white uppercase font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-stone-300 block mb-1">
                Tipe Hadiah
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRdType('coin')}
                  className={`py-2 rounded-xl border text-xs font-semibold ${
                    rdType === 'coin' ? 'bg-white text-black border-white' : 'bg-[#181818] text-stone-400 border-[#262626]'
                  }`}
                >
                  🪙 Coin Gratis
                </button>
                <button
                  type="button"
                  onClick={() => setRdType('border')}
                  className={`py-2 rounded-xl border text-xs font-semibold ${
                    rdType === 'border' ? 'bg-white text-black border-white' : 'bg-[#181818] text-stone-400 border-[#262626]'
                  }`}
                >
                  🎨 Border Gratis
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-stone-300 block mb-1">
                {rdType === 'coin' ? 'Jumlah Coin Per Orang' : 'Pilih Border Hadiah'}
              </label>
              {rdType === 'coin' ? (
                <input
                  type="number"
                  value={rdValue}
                  onChange={(e) => setRdValue(Number(e.target.value))}
                  className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
                />
              ) : (
                <select
                  value={String(rdValue)}
                  onChange={(e) => setRdValue(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
                >
                  <option value="naga">Border NAGA</option>
                  <option value="galaxy">Border GALAXY</option>
                  <option value="semangat-nobar">Border SEMANGAT NOBAR</option>
                </select>
              )}
            </div>

            <div>
              <label className="text-[11px] font-medium text-stone-300 block mb-1">
                Maksimal Pengguna (Kuota)
              </label>
              <input
                type="number"
                value={rdQuota}
                onChange={(e) => setRdQuota(Number(e.target.value))}
                className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
              />
            </div>

            <button
              onClick={() => {
                if (!rdKode.trim()) return;
                createRedeemCode(rdKode, rdType, rdValue, rdQuota);
                setRdKode('');
              }}
              className="w-full py-3 rounded-xl bg-white hover:bg-stone-200 text-black font-heading font-bold text-xs"
            >
              Buat Kode Redeem
            </button>
          </div>
        </div>
      )}

      {/* 4. BROADCASTING */}
      {panelSection === 'broadcast' && (
        <div className="rounded-2xl bg-[#141414] border border-[#262626] p-5">
          <h4 className="font-heading font-bold text-sm text-white mb-1">
            📢 Broadcast Notifikasi & Pesan Owner
          </h4>
          <p className="text-xs text-stone-400 mb-4">
            Kirim pengumuman langsung ke semua user online / Telegram Bot API.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-medium text-stone-300 block mb-1">
                Jenis Broadcast
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBcJenis('popup')}
                  className={`p-2 rounded-xl border text-left ${
                    bcJenis === 'popup' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white font-bold' : 'border-[#262626] bg-[#181818] text-stone-400'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">1. Popup Tengah</div>
                  <div className="text-[9px] text-stone-400">Ga bisa di-skip 3 detik</div>
                </button>
                <button
                  type="button"
                  onClick={() => setBcJenis('banner')}
                  className={`p-2 rounded-xl border text-left ${
                    bcJenis === 'banner' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white font-bold' : 'border-[#262626] bg-[#181818] text-stone-400'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">2. Banner Beranda</div>
                  <div className="text-[9px] text-stone-400">Muncul di atas feed</div>
                </button>
                <button
                  type="button"
                  onClick={() => setBcJenis('chat')}
                  className={`p-2 rounded-xl border text-left ${
                    bcJenis === 'chat' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white font-bold' : 'border-[#262626] bg-[#181818] text-stone-400'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">3. Chat Semua Room</div>
                  <div className="text-[9px] text-stone-400">Badge 👑 OWNER emas</div>
                </button>
                <button
                  type="button"
                  onClick={() => setBcJenis('notif')}
                  className={`p-2 rounded-xl border text-left ${
                    bcJenis === 'notif' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white font-bold' : 'border-[#262626] bg-[#181818] text-stone-400'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">4. Push Notif Bot</div>
                  <div className="text-[9px] text-stone-400">Via Telegram Bot API</div>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-stone-300 block mb-1">
                Target Pengguna
              </label>
              <select
                value={bcTarget}
                onChange={(e) => setBcTarget(e.target.value as Broadcast['target'])}
                className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
              >
                <option value="all">Ke Semua Pengguna</option>
                <option value="online">Ke Yang Lagi Online Doang</option>
                <option value="in_room">Ke Yang Lagi di Room Doang</option>
                <option value="top_10">Ke Top 10 Leaderboard Doang</option>
                <option value="not_checked_in">Ke Yang Belum Check-in Hari Ini</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-stone-300 block mb-1">
                Judul Pengumuman
              </label>
              <input
                type="text"
                value={bcJudul}
                onChange={(e) => setBcJudul(e.target.value)}
                placeholder="Contoh: EVENT MALAM MINGGU NOBAR KUY"
                className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-stone-300 block mb-1">
                Isi Pesan (Gunakan kata LU / GUE, jangan KAMU)
              </label>
              <textarea
                rows={3}
                value={bcPesan}
                onChange={(e) => setBcPesan(e.target.value)}
                placeholder="Contoh: Malam ini ada Bagi-bagi 100 Coin x 50 Orang! Jangan lupa ajak temen lu nobar."
                className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
              />
            </div>

            <button
              onClick={() => {
                if (!bcJudul.trim() || !bcPesan.trim()) return;
                createBroadcast(bcJenis, bcJudul.trim(), bcPesan.trim(), bcTarget);
                setBcJudul('');
                setBcPesan('');
              }}
              className="w-full py-3 rounded-xl bg-white hover:bg-stone-200 text-black font-heading font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Megaphone className="w-4 h-4 text-black" />
              Kirim Broadcast Sekarang!
            </button>
          </div>
        </div>
      )}

      {/* 5. STATISTIK NOBAR KUY */}
      {panelSection === 'stats' && (
        <div className="space-y-4">
          {/* Key Metric Numbers */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626]">
              <span className="text-[10px] text-stone-400 uppercase font-medium">Total Pengguna</span>
              <div className="font-heading font-black text-xl text-white mt-0.5">
                {allUsers.length + 128} User
              </div>
              <span className="text-[9px] text-emerald-400 mt-0.5 block">● 42 Online Sekarang</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626]">
              <span className="text-[10px] text-stone-400 uppercase font-medium">Total Room Live</span>
              <div className="font-heading font-black text-xl text-white mt-0.5">
                {rooms.length} Room
              </div>
              <span className="text-[9px] text-stone-400 mt-0.5 block">104 Jam Nobar Hari Ini</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626]">
              <span className="text-[10px] text-stone-400 uppercase font-medium">Coin Beredar</span>
              <div className="font-heading font-black text-xl text-[#D4AF37] mt-0.5">
                84.250 Coin
              </div>
              <span className="text-[9px] text-stone-400 mt-0.5 block">21.400 Dibakar di Border</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626]">
              <span className="text-[10px] text-stone-400 uppercase font-medium">Check-in Hari Ini</span>
              <div className="font-heading font-black text-xl text-emerald-400 mt-0.5">
                78%
              </div>
              <span className="text-[9px] text-stone-400 mt-0.5 block">12 Orang Streak 7 Hari</span>
            </div>
          </div>

          {/* Top Active Users with instant reward action */}
          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4 text-xs">
            <h5 className="font-heading font-bold text-white mb-2">
              Top 5 Pengguna Paling Aktif Hari Ini
            </h5>
            <div className="space-y-2">
              {allUsers.filter((u) => u.user_id !== '6189849073').slice(0, 5).map((user) => (
                <div
                  key={user.user_id}
                  className="p-2.5 rounded-xl bg-[#181818] border border-[#242424] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      foto={user.foto}
                      nama={user.nama}
                      borderId={user.border_saat_ini}
                      size="xs"
                    />
                    <div>
                      <div className="font-semibold text-white leading-tight">{user.nama}</div>
                      <div className="text-[10px] text-stone-400">@{user.username} • 🪙 {user.coin}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => ownerGiveCoinToUser(user.user_id, 100)}
                    className="px-2.5 py-1 rounded-lg bg-[#D4AF37] hover:bg-[#c4a132] text-black font-heading font-bold text-[10px] flex items-center gap-1 transition-transform active:scale-95"
                  >
                    <Plus className="w-3 h-3 text-black" />
                    Kasih 100 Coin
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
