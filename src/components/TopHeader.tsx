import React from 'react';
import { Menu, KeyRound, LogOut, Bell } from 'lucide-react';

interface TopHeaderProps {
  onToggleSidebar: () => void;
  onLogout?: () => void;
  onOpenQuickSearch?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleSidebar,
  onLogout,
  onOpenQuickSearch,
}) => {
  return (
    <header
      id="wapro-top-header"
      className="sticky top-0 z-30 flex items-center justify-between h-[66px] px-4 lg:px-8 bg-white border-b border-[#E6E8F0] shadow-xs"
    >
      {/* Left: Mobile Toggle and Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          id="header-sidebar-toggle-btn"
          type="button"
          onClick={onToggleSidebar}
          className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
          title="切換選單"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-500">
          <span className="font-semibold text-zinc-800">個案管理</span>
          <span>/</span>
          <span className="text-[#f08327] font-medium">個案狀態管理與數位社會處方</span>
        </div>
      </div>

      {/* Right: Doctor Profile & Actions */}
      <div className="flex items-center gap-3 lg:gap-5">
        {/* Notifications Icon */}
        <button
          id="header-notification-btn"
          type="button"
          onClick={onOpenQuickSearch}
          className="relative p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
          title="最新系統通知"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
        </button>

        {/* Doctor & Clinic Profile */}
        <div className="flex items-center gap-2.5 pl-2">
          <img
            src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=100&auto=format&fit=crop&q=80"
            alt="示範診所"
            className="w-9 h-9 rounded-full object-cover border border-zinc-200 shadow-xs"
          />
          <div className="hidden md:flex flex-col text-left">
            <span className="text-sm font-bold text-[#303651] leading-tight">示範診所</span>
            <span className="text-[11px] text-zinc-400">家醫科 / 個管中心</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-[1.5px] h-7 bg-zinc-300 mx-1 hidden sm:block" />

        {/* Key / API Settings button */}
        <button
          id="header-key-btn"
          type="button"
          onClick={onOpenQuickSearch}
          className="p-2 text-zinc-500 hover:text-[#f08327] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
          title="金鑰與API管理"
        >
          <KeyRound className="w-5 h-5" />
        </button>

        {/* Log Out */}
        <button
          id="header-logout-btn"
          type="button"
          onClick={onLogout}
          className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          title="登出系統"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
