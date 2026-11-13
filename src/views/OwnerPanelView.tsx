import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from '../components/UserAvatar';
import { ALL_BORDERS } from '../data/borders';
import { isOwnerUsername } from '../lib/telegram';
import { Broadcast } from '../types';
import {
  Gift,
  Zap,
  Ticket,
  Megaphone,
  BarChart3,
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';

function getDefaultLocalDateTime(offsetMinutes = 0): string {
  const d = new Date(Date.now() + offsetMinutes * 60000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const OwnerPanelView: React.FC = () => {
  const {
    isOwner,
    onlineCount,
    setActiveTab,
    createGiveaway,
    deleteGiveaway,
    createFlashSale,
    deleteFlashSale,
    createRedeemCode,
    toggleRedeemPublish,
    deleteRedeemCode,
    createBroadcast,
    toggleBroadcastPublish,
    deleteBroadcast,
    ownerGiveCoinToUser,
    allUsers,
    rooms,
    giveaways,
    flashSales,
    redeemCodes,
    broadcasts,
    setToast,
  } = useApp();

  const [panelSection, setPanelSection] = useState<'broadcast' | 'giveaway' | 'flash' | 'redeem' | 'stats'>('broadcast');

  // 1. Broadcast form
  const [bcJenis, setBcJenis] = useState<Broadcast['jenis']>('banner');
  const [bcJudul, setBcJudul] = useState('');
  const [bcPesan, setBcPesan] = useState('');
  const [bcTarget, setBcTarget] = useState<Broadcast['target']>('all');

  // 2. Giveaway form (with Jam Mulai & Jam Selesai)
  const [gwPerOrang, setGwPerOrang] = useState(100);
  const [gwJumlahOrang, setGwJumlahOrang] = useState(50);
  const [gwMulai, setGwMulai] = useState(() => getDefaultLocalDateTime(0));
  const [gwSelesai, setGwSelesai] = useState(() => getDefaultLocalDateTime(60));

  // 3. Flash Sale form (with Jam Mulai & Jam Selesai)
  const [fsBorderId, setFsBorderId] = useState('naga');
  const [fsHargaNormal, setFsHargaNormal] = useState(1000);
  const [fsHargaFlash, setFsHargaFlash] = useState(100);
  const [fsStok, setFsStok] = useState(10);
  const [fsMulai, setFsMulai] = useState(() => getDefaultLocalDateTime(0));
  const [fsSelesai, setFsSelesai] = useState(() => getDefaultLocalDateTime(60));

  // 4. Redeem form (with Jam Mulai & Jam Selesai + Publish)
  const [rdKode, setRdKode] = useState('');
  const [rdType, setRdType] = useState<'coin' | 'border'>('coin');
  const [rdValue, setRdValue] = useState<string | number>(100);
  const [rdQuota, setRdQuota] = useState(50);
  const [rdMulai, setRdMulai] = useState(() => getDefaultLocalDateTime(0));
  const [rdSelesai, setRdSelesai] = useState(() => getDefaultLocalDateTime(1440));

  if (!isOwner) {
    return (
      <div className="py-16 text-center select-none">
        <div className="text-4xl mb-3">🔒</div>
        <h3 className="font-heading font-bold text-lg text-white mb-2">Akses Ditolak</h3>
        <p className="text-xs text-stone-400 mb-4">
          Panel ini cuma bisa dibuka oleh Owner NOBAR KUY (@istamina).
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

  const regularUsers = allUsers.filter((u) => !isOwnerUsername(u.username));
  const totalCoinRegular = regularUsers.reduce((acc, u) => acc + (u.coin || 0), 0);
  const selectableBorders = ALL_BORDERS.filter((b) => b.id !== 'pemula' && b.id !== 'faiz-ganteng');

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#222]">
        <button
          onClick={() => setActiveTab('profil')}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
        <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-heading font-bold text-[10px]">
          👑 PANEL OWNER (@istamina)
        </span>
      </div>

      {/* Sub Navigation */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-[#141414] rounded-2xl border border-[#222] text-xs">
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
          onClick={() => setPanelSection('stats')}
          className={`py-2 px-1 rounded-xl text-center ${
            panelSection === 'stats' ? 'bg-[#1E1E1E] text-emerald-400 font-bold' : 'text-stone-400'
          }`}
        >
          <BarChart3 className="w-4 h-4 mx-auto mb-0.5" />
          <span className="text-[9px] block truncate">Statistik</span>
        </button>
      </div>

      {/* 1. BROADCAST (Buat + Publish / Draft + Hapus) */}
      {panelSection === 'broadcast' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
            <h4 className="font-heading font-bold text-sm text-white mb-1">
              📢 Buat Broadcast
            </h4>
            <p className="text-[11px] text-stone-400 mb-3">
              Publish biar langsung muncul di Beranda semua pengguna.
            </p>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                {(['banner', 'popup', 'chat', 'notif'] as const).map((j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setBcJenis(j)}
                    className={`p-2 rounded-xl border text-left ${
                      bcJenis === j
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white font-bold'
                        : 'border-[#262626] bg-[#181818] text-stone-400'
                    }`}
                  >
                    <div className="font-semibold text-xs uppercase">{j}</div>
                    <div className="text-[9px] text-stone-400">
                      {j === 'banner'
                        ? 'Tampil di Beranda'
                        : j === 'popup'
                        ? 'Popup tengah'
                        : j === 'chat'
                        ? 'Masuk chat'
                        : 'Push Bot Telegram'}
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-300 block mb-1">Judul</label>
                <input
                  type="text"
                  value={bcJudul}
                  onChange={(e) => setBcJudul(e.target.value)}
                  placeholder="Judul broadcast..."
                  className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-300 block mb-1">Isi Pesan</label>
                <textarea
                  rows={3}
                  value={bcPesan}
                  onChange={(e) => setBcPesan(e.target.value)}
                  placeholder="Tulis pengumuman buat user..."
                  className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-300 block mb-1">Target</label>
                <select
                  value={bcTarget}
                  onChange={(e) => setBcTarget(e.target.value as Broadcast['target'])}
                  className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
                >
                  <option value="all">Semua Pengguna</option>
                  <option value="online">Sedang Online</option>
                  <option value="in_room">Lagi di Room</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (!bcJudul.trim() || !bcPesan.trim()) {
                      setToast('Judul dan isi wajib diisi!');
                      return;
                    }
                    createBroadcast(bcJenis, bcJudul.trim(), bcPesan.trim(), bcTarget, false);
                    setBcJudul('');
                    setBcPesan('');
                  }}
                  className="py-2.5 rounded-xl bg-[#222] hover:bg-[#2A2A2A] text-stone-200 font-heading font-bold text-xs"
                >
                  Simpan Draft
                </button>
                <button
                  onClick={() => {
                    if (!bcJudul.trim() || !bcPesan.trim()) {
                      setToast('Judul dan isi wajib diisi!');
                      return;
                    }
                    createBroadcast(bcJenis, bcJudul.trim(), bcPesan.trim(), bcTarget, true);
                    setBcJudul('');
                    setBcPesan('');
                  }}
                  className="py-2.5 rounded-xl bg-white hover:bg-stone-200 text-black font-heading font-bold text-xs"
                >
                  Publish Sekarang
                </button>
              </div>
            </div>
          </div>

          {/* List All Broadcasts */}
          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4 text-xs">
            <h5 className="font-heading font-bold text-white mb-2">
              Semua Broadcast ({broadcasts.length})
            </h5>
            {broadcasts.length === 0 ? (
              <p className="text-stone-500 text-center py-4">Belum ada broadcast.</p>
            ) : (
              <div className="space-y-2">
                {broadcasts.map((bc) => (
                  <div
                    key={bc.id}
                    className="p-3 rounded-xl bg-[#181818] border border-[#222] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-[#D4AF37]">
                          {bc.jenis} • {bc.is_published ? 'PUBLISHED' : 'DRAFT'}
                        </span>
                        <div className="font-bold text-white">{bc.judul}</div>
                        <div className="text-[11px] text-stone-400 mt-0.5">{bc.pesan}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#222]">
                      <button
                        onClick={() => toggleBroadcastPublish(bc.id, !bc.is_published)}
                        className="px-2.5 py-1 rounded-lg bg-[#222] hover:bg-[#2E2E2E] text-stone-200 text-[10px] font-semibold flex items-center gap-1"
                      >
                        {bc.is_published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {bc.is_published ? 'Nonaktifkan' : 'Publish'}
                      </button>
                      <button
                        onClick={() => deleteBroadcast(bc.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-[10px] font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. BAGI-BAGI COIN (Jam Mulai & Jam Selesai + Hapus) */}
      {panelSection === 'giveaway' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
            <h4 className="font-heading font-bold text-sm text-white mb-1">
              🎁 Buat Bagi-bagi Coin
            </h4>
            <p className="text-[11px] text-stone-400 mb-3">
              Sebelum mulai tampil countdown, pas mulai bisa claim 1x per user. Otomatis hilang jika kuota habis atau jam selesai lewat.
            </p>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
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
                    Jumlah Orang / Kuota
                  </label>
                  <input
                    type="number"
                    value={gwJumlahOrang}
                    onChange={(e) => setGwJumlahOrang(Number(e.target.value))}
                    className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-stone-300 block mb-1">Jam Mulai</label>
                  <input
                    type="datetime-local"
                    value={gwMulai}
                    onChange={(e) => setGwMulai(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-2 py-2 text-white text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-stone-300 block mb-1">Jam Selesai</label>
                  <input
                    type="datetime-local"
                    value={gwSelesai}
                    onChange={(e) => setGwSelesai(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-2 py-2 text-white text-[11px]"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#1A1A1A] border border-[#242424] text-[11px] text-stone-300">
                Total Coin: <strong className="text-[#D4AF37]">{(gwPerOrang * gwJumlahOrang).toLocaleString('id-ID')} Coin</strong>
              </div>

              <button
                onClick={() => createGiveaway(gwPerOrang, gwJumlahOrang, gwMulai, gwSelesai)}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-stone-200 text-black font-heading font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Gift className="w-4 h-4 text-black" />
                Buat &amp; Publish Bagi-bagi!
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4 text-xs">
            <h5 className="font-heading font-bold text-white mb-2">Daftar Bagi-bagi ({giveaways.length})</h5>
            {giveaways.length === 0 ? (
              <p className="text-stone-500 text-center py-4">Belum ada event bagi-bagi.</p>
            ) : (
              <div className="space-y-2">
                {giveaways.map((gw) => (
                  <div key={gw.id} className="p-2.5 rounded-xl bg-[#181818] border border-[#222] flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-white">{gw.per_orang} Coin x {gw.jumlah_orang} Orang</span>
                      <div className="text-[10px] text-stone-400">
                        Terklaim: {gw.claims.length}/{gw.jumlah_orang} • Status: {gw.status.toUpperCase()}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteGiveaway(gw.id)}
                      className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. FLASH SALE (Jam Mulai & Jam Selesai + Hapus) */}
      {panelSection === 'flash' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
            <h4 className="font-heading font-bold text-sm text-white mb-1">
              ⚡ Buat Flash Sale Border
            </h4>
            <p className="text-[11px] text-stone-400 mb-3">
              Otomatis hilang dari Beranda jika stok habis atau jam selesai lewat.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-medium text-stone-300 block mb-1">
                  Pilih Border
                </label>
                <select
                  value={fsBorderId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setFsBorderId(id);
                    const def = ALL_BORDERS.find((b) => b.id === id);
                    if (def?.hargaCoin) setFsHargaNormal(def.hargaCoin);
                  }}
                  className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
                >
                  {selectableBorders.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama} {b.hargaCoin ? `(Normal: ${b.hargaCoin} Coin)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-stone-300 block mb-1">Harga Normal</label>
                  <input
                    type="number"
                    value={fsHargaNormal}
                    onChange={(e) => setFsHargaNormal(Number(e.target.value))}
                    className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-stone-300 block mb-1">Harga Flash</label>
                  <input
                    type="number"
                    value={fsHargaFlash}
                    onChange={(e) => setFsHargaFlash(Number(e.target.value))}
                    className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-stone-300 block mb-1">Stok</label>
                  <input
                    type="number"
                    value={fsStok}
                    onChange={(e) => setFsStok(Number(e.target.value))}
                    className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-2.5 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-stone-300 block mb-1">Jam Mulai</label>
                  <input
                    type="datetime-local"
                    value={fsMulai}
                    onChange={(e) => setFsMulai(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-2 py-2 text-white text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-stone-300 block mb-1">Jam Selesai</label>
                  <input
                    type="datetime-local"
                    value={fsSelesai}
                    onChange={(e) => setFsSelesai(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-2 py-2 text-white text-[11px]"
                  />
                </div>
              </div>

              <button
                onClick={() =>
                  createFlashSale(fsBorderId, fsHargaNormal, fsHargaFlash, fsStok, fsMulai, fsSelesai)
                }
                className="w-full py-2.5 rounded-xl bg-white hover:bg-stone-200 text-black font-heading font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4 text-black" />
                Buat &amp; Publish Flash Sale!
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4 text-xs">
            <h5 className="font-heading font-bold text-white mb-2">Daftar Flash Sale ({flashSales.length})</h5>
            {flashSales.length === 0 ? (
              <p className="text-stone-500 text-center py-4">Belum ada Flash Sale.</p>
            ) : (
              <div className="space-y-2">
                {flashSales.map((fs) => (
                  <div key={fs.id} className="p-2.5 rounded-xl bg-[#181818] border border-[#222] flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-white">Border {fs.border_nama}</span>
                      <div className="text-[10px] text-stone-400">
                        {fs.harga_flash} Coin • Sisa: {fs.sisa_stok}/{fs.stok}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteFlashSale(fs.id)}
                      className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. KODE REDEEM (Jam Mulai & Jam Selesai + Publish/Hapus) */}
      {panelSection === 'redeem' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
            <h4 className="font-heading font-bold text-sm text-white mb-1">
              🎟️ Buat Kode Redeem
            </h4>
            <p className="text-[11px] text-stone-400 mb-3">
              Muncul di Beranda jika dipublish &amp; belum habis kuota / waktunya.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-medium text-stone-300 block mb-1">Kode Kupon</label>
                <input
                  type="text"
                  value={rdKode}
                  onChange={(e) => setRdKode(e.target.value.toUpperCase())}
                  placeholder="CONTOH: NOBARKUY100"
                  className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white uppercase font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRdType('coin');
                    setRdValue(100);
                  }}
                  className={`py-2 rounded-xl border text-xs font-semibold ${
                    rdType === 'coin'
                      ? 'bg-white text-black border-white'
                      : 'bg-[#181818] text-stone-400 border-[#262626]'
                  }`}
                >
                  🪙 Hadiah Coin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRdType('border');
                    setRdValue('naga');
                  }}
                  className={`py-2 rounded-xl border text-xs font-semibold ${
                    rdType === 'border'
                      ? 'bg-white text-black border-white'
                      : 'bg-[#181818] text-stone-400 border-[#262626]'
                  }`}
                >
                  🎨 Hadiah Border
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-stone-300 block mb-1">
                    {rdType === 'coin' ? 'Jumlah Coin' : 'Pilih Border'}
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
                      {selectableBorders.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nama}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-medium text-stone-300 block mb-1">Kuota Orang</label>
                  <input
                    type="number"
                    value={rdQuota}
                    onChange={(e) => setRdQuota(Number(e.target.value))}
                    className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-stone-300 block mb-1">Jam Mulai</label>
                  <input
                    type="datetime-local"
                    value={rdMulai}
                    onChange={(e) => setRdMulai(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-2 py-2 text-white text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-stone-300 block mb-1">Jam Selesai</label>
                  <input
                    type="datetime-local"
                    value={rdSelesai}
                    onChange={(e) => setRdSelesai(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-2 py-2 text-white text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={async () => {
                    if (!rdKode.trim()) return;
                    const res = await createRedeemCode(rdKode, rdType, rdValue, rdQuota, rdMulai, rdSelesai, false);
                    if (res.success) setRdKode('');
                  }}
                  className="py-2.5 rounded-xl bg-[#222] hover:bg-[#2A2A2A] text-stone-200 font-heading font-bold text-xs"
                >
                  Simpan Draft
                </button>
                <button
                  onClick={async () => {
                    if (!rdKode.trim()) return;
                    const res = await createRedeemCode(rdKode, rdType, rdValue, rdQuota, rdMulai, rdSelesai, true);
                    if (res.success) setRdKode('');
                  }}
                  className="py-2.5 rounded-xl bg-white hover:bg-stone-200 text-black font-heading font-bold text-xs"
                >
                  Publish Kode
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4 text-xs">
            <h5 className="font-heading font-bold text-white mb-2">Daftar Kode Redeem ({redeemCodes.length})</h5>
            {redeemCodes.length === 0 ? (
              <p className="text-stone-500 text-center py-4">Belum ada kode redeem.</p>
            ) : (
              <div className="space-y-2">
                {redeemCodes.map((rc) => (
                  <div key={rc.id} className="p-2.5 rounded-xl bg-[#181818] border border-[#222] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#D4AF37]">{rc.kode}</span>
                      <span className="text-[10px] text-stone-400">
                        Dipakai: {rc.dipakai_count}/{rc.max_orang} • {rc.is_published ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#222]">
                      <button
                        onClick={() => toggleRedeemPublish(rc.id, !rc.is_published)}
                        className="px-2.5 py-1 rounded-lg bg-[#222] text-stone-200 text-[10px]"
                      >
                        {rc.is_published ? 'Nonaktifkan' : 'Publish'}
                      </button>
                      <button
                        onClick={() => deleteRedeemCode(rc.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 text-[10px] flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. STATISTIK ASLI SERVER (ZERO FAKE NUMBERS!) */}
      {panelSection === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626]">
              <span className="text-[10px] text-stone-400 uppercase font-medium">Total Pengguna Asli</span>
              <div className="font-heading font-black text-xl text-white mt-0.5">
                {allUsers.length} User
              </div>
              <span className="text-[9px] text-emerald-400 mt-0.5 block">● {onlineCount} Online Sekarang</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626]">
              <span className="text-[10px] text-stone-400 uppercase font-medium">Room Live Sekarang</span>
              <div className="font-heading font-black text-xl text-white mt-0.5">
                {rooms.length} Room
              </div>
              <span className="text-[9px] text-stone-400 mt-0.5 block">
                {rooms.filter((r) => !r.is_private).length} Publik • {rooms.filter((r) => r.is_private).length} Private
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626] col-span-2">
              <span className="text-[10px] text-stone-400 uppercase font-medium">Total Coin User Beredar</span>
              <div className="font-heading font-black text-xl text-[#D4AF37] mt-0.5">
                {totalCoinRegular.toLocaleString('id-ID')} Coin
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4 text-xs">
            <h5 className="font-heading font-bold text-white mb-2">
              Pengguna Terdaftar ({regularUsers.length})
            </h5>
            {regularUsers.length === 0 ? (
              <p className="text-stone-500 text-center py-4">Belum ada pengguna lain selain Owner.</p>
            ) : (
              <div className="space-y-2">
                {regularUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className="p-2.5 rounded-xl bg-[#181818] border border-[#242424] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar
                        foto={user.foto}
                        nama={user.nama}
                        borderId={user.border_saat_ini}
                        decorations={user.decorations}
                        size="xs"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-white leading-tight truncate">{user.nama}</div>
                        <div className="text-[10px] text-stone-400 truncate">
                          @{user.username} • 🪙 {user.coin.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => ownerGiveCoinToUser(user.user_id, 100)}
                      className="px-2.5 py-1 rounded-lg bg-[#D4AF37] hover:bg-[#c4a132] text-black font-heading font-bold text-[10px] flex items-center gap-1 shrink-0 transition-transform active:scale-95"
                    >
                      <Plus className="w-3 h-3 text-black" />
                      +100 Coin
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
