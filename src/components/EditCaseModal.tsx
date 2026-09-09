import React, { useState } from 'react';
import { X, Save, User } from 'lucide-react';
import { CaseItem } from '../types';

interface EditCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: CaseItem;
  onSaveCase: (updatedCase: CaseItem) => void;
}

export const EditCaseModal: React.FC<EditCaseModalProps> = ({
  isOpen,
  onClose,
  caseItem,
  onSaveCase,
}) => {
  const [nickname, setNickname] = useState(caseItem.nickname);
  const [name, setName] = useState(caseItem.name);
  const [gender, setGender] = useState(caseItem.gender);
  const [height, setHeight] = useState(caseItem.height);
  const [weight, setWeight] = useState(caseItem.weight);
  const [bloodType, setBloodType] = useState(caseItem.bloodType);
  const [program, setProgram] = useState(caseItem.program);
  const [notes, setNotes] = useState(caseItem.notes);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCase({
      ...caseItem,
      nickname,
      name,
      gender: gender as any,
      height: Number(height) || caseItem.height,
      weight: Number(weight) || caseItem.weight,
      bloodType,
      program,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div
        id="edit-case-modal-card"
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-zinc-200"
      >
        <div className="flex items-center justify-between px-6 py-4 bg-[#f08327] text-white">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <h3 className="text-lg font-bold">編輯個案基本資料</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">暱稱</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">真實姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">性別</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="男">男</option>
                <option value="女">女</option>
                <option value="尚無資料">尚無資料</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">身高 (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">體重 (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">血型</label>
              <input
                type="text"
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">照護計畫</label>
              <input
                type="text"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">醫師/個管師備註</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#f08327] hover:bg-[#d96e19] text-white text-sm font-bold shadow-xs"
            >
              <Save className="w-4 h-4" />
              儲存更新
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
