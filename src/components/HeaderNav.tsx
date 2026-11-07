import React, { useState, useEffect } from 'react';
import {
  Home,
  TrendingUp,
  Receipt,
  FolderKanban,
  CalendarClock,
  Sparkles,
  User as UserIcon,
  LogIn,
  LogOut,
  Calendar,
  CloudCheck,
  RefreshCw,
} from 'lucide-react';
import { NavSection } from '../types/family';
import { User, signInWithGoogle, signOutUser } from '../firebase/config';

interface HeaderNavProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  currentUser: User | null;
  syncing: boolean;
  onRefresh: () => void;
  onResetAll?: () => void;
  onOpenChatbot?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeSection,
  onSelectSection,
  currentUser,
  syncing,
  onRefresh,
  onResetAll,
  onOpenChatbot,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState<string>(() =>
    new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  );
  const [dayName, setDayName] = useState<string>(() =>
    new Date().toLocaleDateString('en-US', { weekday: 'long' })
  );
  const [timeStr, setTimeStr] = useState<string>(() =>
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [showAuthMenu, setShowAuthMenu] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems: { id: NavSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'home', label: '1. Home', icon: <Home className="w-4 h-4" /> },
    { id: 'income', label: '2. Income', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'expenditure', label: '3. Expenditure', icon: <Receipt className="w-4 h-4" /> },
    { id: 'miscellaneous', label: '4. Miscellaneous & Studio', icon: <Sparkles className="w-4 h-4" /> },
  ];

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      setShowAuthMenu(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      setShowAuthMenu(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Brand & Live Date Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between border-b border-slate-100/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 font-bold tracking-tight">
            FD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">Family Diary</span>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/60 uppercase tracking-wider">
                Database App
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Family Income, Expenditure & Life Ledger</p>
          </div>
        </div>

        {/* Live Date, Time & Auth Widget */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200/70 rounded-lg px-3 py-1.5 text-xs text-slate-600 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-slate-800">{dayName}</span>
            <span className="text-slate-300">|</span>
            <span>{currentDateTime}</span>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-slate-500">{timeStr}</span>
          </div>

          {/* Refresh / Sync Button */}
          <button
            onClick={onRefresh}
            title="Refresh database sync"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {/* AI Chatbot Button */}
          {onOpenChatbot && (
            <button
              onClick={onOpenChatbot}
              title="Launch Gemini AI Chatbot"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">AI Chatbot</span>
            </button>
          )}

          {/* Reset All Data Button */}
          {onResetAll && (
            <button
              onClick={onResetAll}
              title="Reset all data to 0"
              className="px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/60 rounded-lg transition-colors flex items-center gap-1"
            >
              Reset to 0
            </button>
          )}

          {/* Auth State Button */}
          <div className="relative">
            {currentUser ? (
              <button
                onClick={() => setShowAuthMenu(!showAuthMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs text-slate-700 transition-colors"
              >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="User" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className="font-medium max-w-[100px] truncate">{currentUser.displayName || 'Member'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Google Sign-In</span>
              </button>
            )}

            {showAuthMenu && currentUser && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-800">{currentUser.displayName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                    Firestore Sync Active
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Top Row Navigation - As requested by user */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none">
          {navItems.map(item => {
            const isActive = activeSection === item.id || (item.id === 'expenditure' && activeSection === 'project');
            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs scale-[1.01]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
