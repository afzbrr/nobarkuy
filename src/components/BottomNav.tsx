import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Film, Trophy, Palette, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const tabs = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'room', label: 'Room', icon: Film },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'border', label: 'Border Saya', icon: Palette },
    { id: 'profil', label: 'Profil', icon: User },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-[#1F1F1F] pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 transition-all duration-200 select-none relative ${
                isActive ? 'text-white' : 'text-stone-400 hover:text-stone-300'
              }`}
            >
              <div
                className={`w-9 h-7 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-[#1E1E1E] text-[#D4AF37]' : ''
                }`}
              >
                <Icon className={`w-[18px] h-[18px] transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              </div>
              <span className={`text-[10px] tracking-tight leading-none ${isActive ? 'font-semibold text-white' : 'font-normal'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#D4AF37]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
