import React, { useState } from 'react';
import { 
  MessageSquare, 
  FileSpreadsheet, 
  BookOpen, 
  Ticket, 
  Bot, 
  UserCheck, 
  TrendingUp, 
  Settings,
  Send,
  Download,
  CheckCircle2,
  Search,
  ImagePlus,
  MessagesSquare,
  UserRound
} from 'lucide-react';
import { CaseItem } from '../types';

export const MessagesView: React.FC<{ cases: CaseItem[]; initialCaseId?: string | null }> = ({ cases, initialCaseId }) => {
  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId ?? cases[0]?.id ?? '');
  const [draft, setDraft] = useState('');
  const selectedCase = cases.find((item) => item.id === selectedCaseId) ?? cases[0];
  if (!selectedCase) return null;
  return (
    <div className="h-[calc(100vh-108px)] min-h-[620px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[280px_minmax(360px,1fr)_280px]">
        <aside className="flex min-h-0 flex-col border-r border-zinc-200"><div className="border-b border-zinc-200 p-4"><h3 className="flex items-center gap-2 text-lg font-bold"><MessageSquare className="h-5 w-5 text-[#f08327]" />訊息</h3><div className="relative mt-3"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><input aria-label="搜尋個案" placeholder="搜尋個案" className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm outline-none focus:border-[#f08327]" /></div></div><div className="min-h-0 flex-1 overflow-y-auto">{cases.slice(0, 6).map((item) => <button key={item.id} onClick={() => setSelectedCaseId(item.id)} className={`flex w-full gap-3 border-b border-zinc-100 p-3 text-left ${item.id === selectedCase.id ? 'bg-orange-50' : 'hover:bg-zinc-50'}`}><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold">{(item.nickname || item.name).slice(0, 1)}</div><div className="min-w-0"><p className="truncate text-sm font-bold">{item.nickname || item.name}</p><p className="mt-1 line-clamp-2 text-xs text-zinc-500">歡迎來到示範診所線上健康諮詢頻道</p></div></button>)}</div></aside>
        <section className="flex min-h-0 flex-col bg-[#f7f7f7]"><div className="flex h-[66px] shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5"><div><h4 className="font-bold">{selectedCase.nickname || selectedCase.name}</h4><span className="text-xs font-medium text-emerald-600">● 綠色處方進行中</span></div><button className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold">查看個案</button></div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <AutoAvatarMessage><p className="font-bold">親愛的會員您好！歡迎來到【示範診所】線上健康諮詢頻道 🌿</p><p className="mt-3">本頻道支援「綠色處方燈」服務，透過運動、營養、舒眠與減壓等非藥物生活型態，引導您改善健康。您可以在綠色處方首頁查看執行進度、填寫問卷與執行衛教任務。</p><p className="mt-3 font-bold text-emerald-600 underline">🌿 前往綠色處方燈</p></AutoAvatarMessage>
          </div>
          <div className="shrink-0 border-t border-zinc-200 bg-white p-3"><div className="mb-2 flex gap-1"><button className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"><ImagePlus className="h-5 w-5" /></button><button className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"><MessagesSquare className="h-5 w-5" /></button></div><div className="flex items-end gap-2"><textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} placeholder="輸入訊息..." className="min-h-[48px] flex-1 resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm" /><button onClick={() => setDraft('')} disabled={!draft.trim()} className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f08327] text-white disabled:opacity-40"><Send className="h-5 w-5" /></button></div></div>
        </section>
        <aside className="hidden min-h-0 overflow-y-auto border-l border-zinc-200 bg-white p-5 lg:block"><div className="flex flex-col items-center border-b border-zinc-200 pb-5"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100"><UserRound className="h-9 w-9" /></div><h4 className="mt-3 text-lg font-bold">{selectedCase.nickname || selectedCase.name}</h4><p className="mt-3 w-full rounded-lg bg-[#efefef] p-3 text-xs">註記：{selectedCase.notes}</p></div><dl className="space-y-3 py-5 text-sm"><div className="flex justify-between"><dt className="text-zinc-400">生日</dt><dd>{selectedCase.birthday}</dd></div><div className="flex justify-between"><dt className="text-zinc-400">性別</dt><dd>{selectedCase.gender}</dd></div><div className="flex justify-between"><dt className="text-zinc-400">計畫</dt><dd>{selectedCase.program}</dd></div></dl></aside>
      </div>
    </div>
  );
};

const AutoAvatarMessage: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="mb-4 flex flex-row-reverse items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-base text-white">🌾</div><div className="max-w-xl"><p className="mb-1 text-right text-xs font-bold text-zinc-500">示範診所</p><div className="rounded-l-2xl rounded-br-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-7 text-[#303651] shadow-xs">{children}</div></div></div>;

export const ExportView: React.FC<{ cases: CaseItem[] }> = ({ cases }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-md space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#f08327]" />
            資料匯出與全人健康成效分析
          </h3>
          <p className="text-xs text-zinc-400">匯出符合衛福部與長照據點格式之生理數據、處方達標率及出席報表</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-zinc-200 bg-amber-50/40 space-y-3">
          <h4 className="font-bold text-zinc-800 text-sm">個案健康指標總表</h4>
          <p className="text-xs text-zinc-600">包含收縮/舒張壓、BMI、步數、血糖與回診紀錄（共 {cases.length} 筆）。</p>
          <button
            onClick={() => alert('已匯出 個案健康指標總表.xlsx')}
            className="w-full py-2 bg-[#f08327] text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 hover:bg-[#d96e19]"
          >
            <Download className="w-4 h-4" /> 下載 Excel (.xlsx)
          </button>
        </div>

        <div className="p-5 rounded-xl border border-zinc-200 bg-emerald-50/40 space-y-3">
          <h4 className="font-bold text-zinc-800 text-sm">數位綠色處方達標月報表</h4>
          <p className="text-xs text-zinc-600">九大類別處方任務執行次數、時長、達標率統計與醫師醫囑彙整。</p>
          <button
            onClick={() => alert('已匯出 數位綠色處方達標月報表.csv')}
            className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 hover:bg-emerald-700"
          >
            <Download className="w-4 h-4" /> 下載 CSV (.csv)
          </button>
        </div>

        <div className="p-5 rounded-xl border border-zinc-200 bg-blue-50/40 space-y-3">
          <h4 className="font-bold text-zinc-800 text-sm">個別化個案追蹤全紀錄</h4>
          <p className="text-xs text-zinc-600">產出符合健保署與遠距醫療審查標準之個案病歷摘要與處方歷程。</p>
          <button
            onClick={() => alert('已匯出 個別化個案追蹤全紀錄.pdf')}
            className="w-full py-2 bg-[#303651] text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 hover:bg-zinc-800"
          >
            <Download className="w-4 h-4" /> 下載 PDF (.pdf)
          </button>
        </div>
      </div>
    </div>
  );
};

export const CoursesView: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-md space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#f08327]" />
            全銀運動與社會處方課程庫管理
          </h3>
          <p className="text-xs text-zinc-400">挑選、新增與管理供醫師開立處方之 Live 與影音衛教課程</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: '全銀有氧超慢跑 (初階)', category: '身體活動', type: 'Live 直播', time: '每週二四 10:00', enrolled: 128 },
          { title: '銀髮舒壓筋膜放鬆術', category: '自我照護管理', type: '隨選影片', time: '隨時觀看 (15分)', enrolled: 310 },
          { title: '外食控糖減鹽烹調小教室', category: '自我管理教育', type: '隨選影片', time: '隨時觀看 (20分)', enrolled: 245 },
          { title: '社區正念呼吸與靜心禪修', category: '個人發展', type: 'Live 直播', time: '每週三 19:30', enrolled: 89 },
          { title: '銀髮藝術粉彩畫與手作課', category: '藝術活動', type: '隨選影片', time: '隨時觀看 (40分)', enrolled: 160 },
          { title: '防跌肌力與彈力帶操', category: '身體活動', type: 'Live 直播', time: '每週五 14:00', enrolled: 210 },
        ].map((course, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-zinc-200 bg-white space-y-2 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800">{course.category}</span>
              <span className="font-medium text-emerald-600">{course.type}</span>
            </div>
            <h4 className="font-bold text-zinc-900 text-sm">{course.title}</h4>
            <p className="text-xs text-zinc-400">{course.time}</p>
            <div className="pt-2 flex items-center justify-between text-xs border-t">
              <span className="text-zinc-500">已指派 {course.enrolled} 人次</span>
              <button 
                onClick={() => alert(`已將「${course.title}」加入醫師常用處方範本`)}
                className="text-[#f08327] font-bold hover:underline"
              >
                設為常用處方
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AiReplyView: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-md space-y-6">
      <div className="border-b pb-4">
        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
          <Bot className="w-5 h-5 text-[#f08327]" />
          AI 智慧健康小幫手回覆設定
        </h3>
        <p className="text-xs text-zinc-400">設定 AI 自動依據個案之生理數值異常（如血壓超標）自動發送初階衛教指引</p>
      </div>

      <div className="space-y-4 text-sm">
        <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-800">血壓異常自動應答 (收縮壓 ≥ 140 mmHg)</span>
            <input type="checkbox" defaultChecked className="toggle-checkbox text-[#f08327]" />
          </div>
          <p className="text-xs text-zinc-500">
            自動回覆內容：「提醒您：目前測量血壓偏高，請先靜坐休息 15 分鐘後重新量測。若持續不適請與李綜合門診聯繫。」
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-800">連續 3 天未完成處方運動提醒</span>
            <input type="checkbox" defaultChecked className="toggle-checkbox text-[#f08327]" />
          </div>
          <p className="text-xs text-zinc-500">
            自動推播內容：「哈囉！您本週的超慢跑處方尚未達標，今天抽空活動 15 分鐘吧，健康每一天！」
          </p>
        </div>
      </div>
    </div>
  );
};
