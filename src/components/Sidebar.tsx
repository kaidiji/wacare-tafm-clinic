import React from 'react';
import { 
  Users, 
  MessageSquare, 
  FileSpreadsheet, 
  BookOpen, 
  Ticket, 
  Bot, 
  UserCheck, 
  TrendingUp, 
  Settings,
  X
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const menuSections = [
    {
      title: '個案管理',
      items: [
        { id: 'cases', label: '我的個案', icon: Users, badge: undefined },
        { id: 'messages', label: '訊息', icon: MessageSquare, badge: '3' },
        { id: 'export', label: '資料匯出與分析', icon: FileSpreadsheet, badge: undefined },
      ],
    },
    {
      title: '課程管理',
      items: [
        { id: 'courses', label: '課程管理', icon: BookOpen, badge: undefined },
        { id: 'coupons', label: '發送優惠券', icon: Ticket, badge: undefined },
      ],
    },
    {
      title: '討論區管理',
      items: [
        { id: 'ai-reply', label: 'AI 回覆設定', icon: Bot, badge: undefined },
      ],
    },
    {
      title: '專家管理',
      items: [
        { id: 'expert-profile', label: '專家資料編輯', icon: UserCheck, badge: undefined },
        { id: 'promote', label: '推廣我自己', icon: TrendingUp, badge: undefined },
      ],
    },
    {
      title: '其他',
      items: [
        { id: 'api-settings', label: 'API設定', icon: Settings, badge: undefined },
      ],
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpenMobile && (
        <div
          id="sidebar-mobile-overlay"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        id="wapro-main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-[#CCC] shadow-xl lg:shadow-none flex flex-col transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5] h-[66px]">
          <div 
            onClick={() => onSelectTab('cases')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            {/* WaPro Brand Mark SVG */}
            <div className="flex items-center gap-1.5">
              <svg width="34" height="28" viewBox="0 0 50 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="12" r="5" fill="#f08327" />
                <circle cx="40" cy="12" r="5" fill="#f08327" />
                <path
                  d="M5 24C12 34 18 34 25 24C32 34 38 34 45 24"
                  stroke="#f08327"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[22px] font-black tracking-tight text-[#f08327]">
                Wa<span className="text-[#303651]">Pro</span>
              </span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-4 space-y-4">
          {menuSections.map((section, sIndex) => (
            <div key={sIndex} className="space-y-1">
              <h6 className="px-3 py-1.5 text-[13px] font-bold text-[#8B8D97] uppercase tracking-wider">
                {section.title}
              </h6>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        id={`sidebar-item-${item.id}`}
                        type="button"
                        onClick={() => {
                          onSelectTab(item.id);
                          onCloseMobile();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-[#f08327] text-white shadow-sm'
                            : 'text-[#303651] hover:bg-[#ffe5d0] hover:text-[#f08327]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#898989]'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-white text-[#f08327]' : 'bg-[#22ac38] text-white'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {sIndex < menuSections.length - 1 && (
                <div className="pt-2">
                  <div className="h-px bg-zinc-200/80 w-full" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Clinic Footer Info */}
        <div className="p-3 border-t border-zinc-200 bg-[#FBFBFB] flex items-center justify-between text-xs text-zinc-500">
          <span>機構端系統 v2.6.4</span>
          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            連線正常
          </span>
        </div>
      </aside>
    </>
  );
};
