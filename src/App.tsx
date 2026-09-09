import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { CaseOverview } from './components/CaseOverview';
import { PrescriptionDetail } from './components/PrescriptionDetail';
import { EditCaseModal } from './components/EditCaseModal';
import { ConnectDataModal } from './components/ConnectDataModal';
import { MessagesView, ExportView, CoursesView, AiReplyView } from './components/OtherViews';
import { INITIAL_CASES } from './data/mockCases';
import { CaseItem } from './types';
import { synchronizePrescriptionStatus } from './utils/greenPrescriptionMetrics';
import { createPrototypeCases } from './utils/greenPrescriptionDomain';

export default function App() {
  // Prototype 操作只保留於本次頁面生命週期；重新整理時一律回到程式內建 Demo state。
  const [cases, setCases] = useState<CaseItem[]>(() => createPrototypeCases(INITIAL_CASES));
  const [currentTab, setCurrentTab] = useState<string>('cases');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  
  // Modals state
  const [editingCase, setEditingCase] = useState<CaseItem | null>(null);
  const [dataModalType, setDataModalType] = useState<'import' | 'connect' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Find currently selected case for prescription view
  const currentCase = cases.find((c) => c.id === selectedCaseId) || null;

  // Update a single case
  const handleUpdateCase = (updatedCase: CaseItem) => {
    const synchronizedCase = synchronizePrescriptionStatus(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === synchronizedCase.id ? synchronizedCase : c)));
    showToast(`已成功儲存 ${updatedCase.nickname || updatedCase.name} 的處方與個案資訊！`);
  };

  return (
    <div className="flex h-screen bg-[#efefef] font-sans antialiased text-[#303651] overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#303651] text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-2xl border border-zinc-700 animate-in fade-in slide-in-from-top-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'cases') {
            setSelectedCaseId(null);
          }
        }}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 h-full overflow-hidden">
        {/* Top Header */}
        <TopHeader
          onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          onLogout={() => showToast('已成功登出 WaPro 系統')}
          onOpenQuickSearch={() => showToast('金鑰與API連線正常（端點：https://api.wacare.live）')}
        />

        {/* Dynamic Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5">
          {currentTab === 'cases' && (
            <>
              {currentCase ? (
                /* Detail / Green Prescription view (Image 2) */
                <PrescriptionDetail
                  caseItem={currentCase}
                  onBack={() => setSelectedCaseId(null)}
                  onUpdateCase={handleUpdateCase}
                  onOpenMessages={() => setCurrentTab('messages')}
                  onOpenExport={() => setCurrentTab('export')}
                />
              ) : (
                /* Home / Case Overview Table view (Attachment / Image 1) */
                <CaseOverview
                  cases={cases}
                  onSelectCaseForPrescription={(caseItem) => setSelectedCaseId(caseItem.id)}
                  onOpenEditNote={(caseItem) => setEditingCase(caseItem)}
                  onImportData={() => setDataModalType('import')}
                  onConnectData={() => setDataModalType('connect')}
                />
              )}
            </>
          )}

          {currentTab === 'messages' && <MessagesView cases={cases} initialCaseId={selectedCaseId} />}
          {currentTab === 'export' && <ExportView cases={cases} />}
          {currentTab === 'courses' && <CoursesView />}
          {currentTab === 'coupons' && <CoursesView />}
          {currentTab === 'ai-reply' && <AiReplyView />}
          {currentTab === 'expert-profile' && (
            <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-md">
              <h3 className="text-lg font-bold text-zinc-900 mb-2">專家資料與機構認證編輯</h3>
              <p className="text-xs text-zinc-500 mb-4">維護李綜合醫院家醫科醫療團隊簡介與專長</p>
              <div className="p-4 bg-zinc-50 rounded-xl border space-y-2 text-sm">
                <div><strong>院所名稱：</strong>苑裡李綜合醫院</div>
                <div><strong>負責醫師：</strong>王志銘 院長 / 主治醫師</div>
                <div><strong>專長領域：</strong>慢性病照護、全人健康管理、預防醫學、高齡綠色處方運動</div>
              </div>
            </div>
          )}
          {currentTab === 'promote' && (
            <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-md">
              <h3 className="text-lg font-bold text-zinc-900 mb-2">推廣我自己與社區據點連結</h3>
              <p className="text-xs text-zinc-500 mb-4">生成衛教 QR Code 與長照社區據點邀請連結</p>
              <button 
                onClick={() => showToast('已複製機構專屬推廣加入連結！')}
                className="px-4 py-2 bg-[#f08327] text-white font-bold text-xs rounded-lg shadow"
              >
                複製 WaCare 社區推廣邀請碼
              </button>
            </div>
          )}
          {currentTab === 'api-settings' && (
            <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-md space-y-4">
              <h3 className="text-lg font-bold text-zinc-900">API 介接與系統整合設定</h3>
              <p className="text-xs text-zinc-500">串接 HL7 FHIR 與健保署門診電子病歷端點</p>
              <div className="p-4 bg-zinc-50 rounded-xl border font-mono text-xs text-zinc-700 space-y-1">
                <div>ENDPOINT: https://his-gw.wacare.live/v1/fhir</div>
                <div>CLIENT_ID: wapro-yuanli-li-general</div>
                <div>STATUS: ACTIVE (200 OK)</div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit Case Modal */}
      {editingCase && (
        <EditCaseModal
          isOpen={!!editingCase}
          onClose={() => setEditingCase(null)}
          caseItem={editingCase}
          onSaveCase={handleUpdateCase}
        />
      )}

      {/* Connect / Import Data Modal */}
      {dataModalType && (
        <ConnectDataModal
          isOpen={!!dataModalType}
          type={dataModalType}
          onClose={() => setDataModalType(null)}
          onSuccess={() => {
            showToast(dataModalType === 'import' ? '個案資料已成功匯入！' : 'HIS 醫療數據已同步完成！');
          }}
        />
      )}
    </div>
  );
}
