import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Edit3,
  MessageSquare,
  UserRound,
} from 'lucide-react';
import { CaseItem } from '../types';

interface CaseProfilePanelProps {
  caseItem: CaseItem;
  onEdit: () => void;
  onOpenMessages: () => void;
  onOpenExport: () => void;
}

const displayValue = (value: string | number | null | undefined, suffix = '') =>
  value === undefined || value === null || value === '' || value === '尚無資料'
    ? '尚無資料'
    : `${value}${suffix}`;

interface ProfileRowProps {
  label: string;
  value: React.ReactNode;
}

const ProfileRow: React.FC<ProfileRowProps> = ({ label, value }) => (
  <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2 border-b border-zinc-100 py-2.5 last:border-b-0">
    <dt className="text-xs font-medium text-zinc-400">{label}</dt>
    <dd className="min-w-0 break-words text-right text-xs font-bold text-zinc-700">{value}</dd>
  </div>
);

export const CaseProfilePanel: React.FC<CaseProfilePanelProps> = ({
  caseItem,
  onEdit,
  onOpenMessages,
  onOpenExport,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(caseItem.code);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setCopiedCode(false);
    }
  };

  return (
    <aside aria-label="個案個人資訊" className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-md lg:sticky lg:top-0 lg:self-start">
      <div className="border-b border-zinc-100 bg-linear-to-b from-orange-50 to-white px-4 pb-4 pt-5 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-orange-100 shadow-sm">
          {caseItem.avatarUrl ? (
            <img src={caseItem.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserRound className="h-10 w-10 text-[#f08327]" />
          )}
        </div>
        <h1 className="mt-3 text-xl font-black text-zinc-900">{displayValue(caseItem.nickname)}</h1>
        <p className="mt-1 text-xs font-medium text-zinc-500">{displayValue(caseItem.name)}</p>
        <button
          type="button"
          onClick={onEdit}
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#f08327] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#d96e19]"
        >
          <Edit3 className="h-4 w-4" />
          編輯個案資料
        </button>
      </div>

      <dl className="px-4 py-2">
        <ProfileRow label="真實姓名" value={displayValue(caseItem.name)} />
        <ProfileRow label="身分證" value={displayValue(caseItem.idNumber)} />
        <ProfileRow label="性別" value={displayValue(caseItem.gender)} />
        <ProfileRow label="生日／年齡" value={`${displayValue(caseItem.birthday)}／${displayValue(caseItem.age, ' 歲')}`} />
        <ProfileRow label="身高" value={displayValue(caseItem.height, ' cm')} />
        <ProfileRow label="體重" value={displayValue(caseItem.weight, ' kg')} />
        <ProfileRow label="血型" value={displayValue(caseItem.bloodType)} />
        <ProfileRow
          label="個人代碼"
          value={(
            <span className="inline-flex max-w-full items-center justify-end gap-1">
              <span className="truncate font-mono">{displayValue(caseItem.code)}</span>
              <button type="button" onClick={handleCopyCode} className="shrink-0 rounded p-1 hover:bg-zinc-100" aria-label="複製個人代碼">
                {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </span>
          )}
        />
        <ProfileRow label="追蹤時間" value={displayValue(caseItem.trackingDate)} />
        <ProfileRow label="註記" value={displayValue(caseItem.notes)} />
        <ProfileRow label="計畫" value={displayValue(caseItem.program)} />
        <ProfileRow label="收案時間" value={displayValue(caseItem.enrolledDate)} />
      </dl>

      <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 p-4">
        <button type="button" onClick={onOpenMessages} className="flex items-center justify-center gap-1.5 rounded-lg border border-[#f08327] px-2 py-2 text-xs font-bold text-[#f08327] hover:bg-orange-50">
          <MessageSquare className="h-4 w-4" />訊息
        </button>
        <button type="button" onClick={onOpenExport} className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-2 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50">
          <Download className="h-4 w-4" />下載
        </button>
      </div>
    </aside>
  );
};
