import React, { useState } from 'react';
import { X, UploadCloud, CheckCircle2, Database, FileSpreadsheet, RefreshCw } from 'lucide-react';

interface ConnectDataModalProps {
  isOpen: boolean;
  type: 'import' | 'connect';
  onClose: () => void;
  onSuccess: () => void;
}

export const ConnectDataModal: React.FC<ConnectDataModalProps> = ({
  isOpen,
  type,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('his');

  if (!isOpen) return null;

  const handleAction = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess();
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-zinc-200 animate-in fade-in">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            {type === 'import' ? (
              <FileSpreadsheet className="w-6 h-6 text-[#f08327]" />
            ) : (
              <Database className="w-6 h-6 text-[#f08327]" />
            )}
            <h3 className="text-lg font-bold text-zinc-900">
              {type === 'import' ? '匯入個案資料' : 'HIS / 遠距醫療數據串接'}
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {type === 'import' ? (
          <div className="space-y-4 text-sm text-zinc-600">
            <p>支援匯入 Excel (.xlsx, .xls) 或 CSV 格式的個案生理數據與名冊清單：</p>
            <div className="border-2 border-dashed border-zinc-300 rounded-xl p-8 text-center bg-zinc-50 hover:bg-orange-50/50 transition-colors cursor-pointer">
              <UploadCloud className="w-10 h-10 text-[#f08327] mx-auto mb-2" />
              <p className="font-bold text-zinc-700">點擊選擇檔案 或 拖曳檔案至此</p>
              <p className="text-xs text-zinc-400 mt-1">支援檔案上限 20MB</p>
            </div>
            <div className="text-xs text-zinc-400 flex items-center justify-between">
              <span>範本下載：<a href="#template" onClick={(e) => { e.preventDefault(); alert('已下載 WaPro 個案標準匯入範本.xlsx'); }} className="text-[#f08327] underline">WaPro個案匯入範本.xlsx</a></span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-sm text-zinc-600">
            <p>請選擇欲串接之醫療院所資訊系統 (HIS) 或 穿戴式生理量測 API：</p>
            <div className="space-y-2">
              {[
                { id: 'his', name: '院內 HIS / 門診電子病歷系統 (HL7 FHIR API)' },
                { id: 'wacare', name: 'WaCare 遠距生理數據雲端平台 (IoT 藍牙即時同步)' },
                { id: 'nhi', name: '全民健康保險醫療資訊雲端查詢系統' },
              ].map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    source === item.id ? 'border-[#f08327] bg-orange-50/60 font-bold' : 'border-zinc-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="connect-source"
                    checked={source === item.id}
                    onChange={() => setSource(item.id)}
                    className="text-[#f08327] focus:ring-[#f08327]"
                  />
                  <span>{item.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            取消
          </button>
          <button
            onClick={handleAction}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-[#f08327] hover:bg-[#d96e19] text-white font-bold text-sm rounded-lg shadow-xs transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>處理中...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{type === 'import' ? '開始匯入' : '立即同步連線'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
