import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { BerandaView } from './views/BerandaView';
import { RoomView } from './views/RoomView';
import { CoinGratisView } from './views/CoinGratisView';
import { LeaderboardView } from './views/LeaderboardView';
import { BorderView } from './views/BorderView';
import { ProfilView } from './views/ProfilView';
import { OwnerPanelView } from './views/OwnerPanelView';
import { WalletModal } from './components/modals/WalletModal';
import { TransferModal } from './components/modals/TransferModal';
import { BroadcastPopupModal } from './components/modals/BroadcastPopupModal';
import { NonTelegramWarningModal } from './components/modals/NonTelegramWarningModal';
import { initTelegram } from './lib/telegram';

const MainAppContent: React.FC = () => {
  const { activeTab, toastMessage, isTelegramAuthenticated, isLoading } = useApp();

  useEffect(() => {
    initTelegram();
  }, []);

  if (!isTelegramAuthenticated) {
    return <NonTelegramWarningModal />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 text-center select-none">
        <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mb-3" />
        <p className="text-xs text-stone-400 font-medium">Menghubungkan akun Telegram lu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#D4AF37]/30">
      {/* Top Navbar */}
      <Navbar />

      {/* Main View Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-3 pb-24 overflow-x-hidden">
        {activeTab === 'beranda' && <BerandaView />}
        {activeTab === 'room' && <RoomView />}
        {activeTab === 'coin_gratis' && <CoinGratisView />}
        {activeTab === 'leaderboard' && <LeaderboardView />}
        {activeTab === 'border' && <BorderView />}
        {activeTab === 'profil' && <ProfilView />}
        {activeTab === 'owner_panel' && <OwnerPanelView />}
      </main>

      {/* Global Bottom Navigation (6 Tabs) */}
      <BottomNav />

      {/* Global Modals & Notifications */}
      <WalletModal />
      <TransferModal />
      <BroadcastPopupModal />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 inset-x-4 z-50 flex justify-center pointer-events-none select-none animate-float-subtle">
          <div className="px-4 py-2 rounded-xl bg-[#181818]/95 backdrop-blur-md border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold shadow-2xl flex items-center gap-2">
            <span>✨</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
