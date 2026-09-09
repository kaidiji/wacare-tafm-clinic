import React, { useEffect, useMemo, useState } from 'react';
import { Check, Info, Leaf, X } from 'lucide-react';
import { LifestyleFocus, TaskCategory } from '../types';

export interface SelectedPrescription {
  focus: string;
  text: string;
  level: '基本處方' | '加強處方';
  category: TaskCategory;
}

interface AdvancedSection {
  title: string;
  options: string[];
}

interface PrescriptionGroup {
  focus: string;
  surveyFocus: LifestyleFocus;
  category: TaskCategory;
  basic: string[];
  advanced: AdvancedSection[];
}

const GROUPS: PrescriptionGroup[] = [
  {
    focus: '飲食',
    surveyFocus: '飲食習慣',
    category: '自我管理教育',
    basic: ['每日攝取至少 3 份蔬菜、2 份水果', '減少高油、高鹽食物', '減少精緻澱粉及含糖飲料', '減少紅肉及加工食品攝取'],
    advanced: [{ title: '個別化加強處方', options: ['以植物性為主，採均衡、多樣化飲食', '適量攝取植物性蛋白質、堅果及優質植物油', '減少外食頻率', '減少宵夜及不必要點心', '控制甜食攝取', '體重管理飲食調整', '轉介營養師諮詢', '其它'] }],
  },
  {
    focus: '身體活動',
    surveyFocus: '運動習慣',
    category: '身體活動',
    basic: ['每週累積至少 150 分鐘中等強度有氧運動', '依個人體能及健康狀況逐步增加活動量'],
    advanced: [
      { title: '運動類型', options: ['有氧運動（如快走、慢跑、游泳、球類運動）', '重量訓練', '伸展運動（如瑜珈、皮拉提斯）', '氣功、太極', '其他'] },
      { title: '建議頻率', options: ['每週 1-2 天', '每週 3-4 天', '每週 5-6 天', '每天'] },
      { title: '每次時間', options: ['10-20 分鐘', '20-30 分鐘', '30-60 分鐘'] },
    ],
  },
  {
    focus: '睡眠',
    surveyFocus: '睡眠品質',
    category: '自我照護管理',
    basic: ['建立規律作息及固定睡眠時間', '維持適當睡眠時數', '建立良好睡眠環境', '睡前進行放鬆活動（伸展、冥想、閱讀等）'],
    advanced: [{ title: '個別化加強處方', options: ['固定起床時間', '睡前減少使用 3C 產品', '避免睡前攝取咖啡因', '轉介睡眠／減重專業門診', '其他'] }],
  },
  {
    focus: '壓力管理',
    surveyFocus: '壓力管理',
    category: '個人發展',
    basic: ['每週安排個人放鬆時間', '練習適合自己的壓力調適方法', '建立規律的休息與放鬆習慣'],
    advanced: [{ title: '個別化加強處方', options: ['腹式呼吸訓練', '正念／冥想練習', '肌肉放鬆法', '參與紓壓或壓力管理課程', '心理諮商或相關專業轉介', '其他'] }],
  },
  {
    focus: '正向社會連結',
    surveyFocus: '增加人際互動',
    category: '社交互動',
    basic: ['維持與家人、朋友或他人的正向互動', '每週至少安排一次社交、社區或興趣活動', '建立適合自己的社會支持網絡'],
    advanced: [{ title: '個別化加強處方', options: ['參與社區運動團體', '參與社區關懷據點活動', '參與興趣或學習團體', '參與志工服務', '參與藝文活動', '其他'] }],
  },
  {
    focus: '避免危害物質使用',
    surveyFocus: '戒菸／戒酒／戒檳榔',
    category: '自我照護管理',
    basic: ['避免或減少菸草、過量酒精及檳榔等危害健康物質', '減少環境毒素暴露，如空氣污染及室內污染', '依個人使用情形設定減量或戒除目標'],
    advanced: [{ title: '個別化加強處方', options: ['訂定戒菸日期或減菸目標', '鼓勵戒菸並轉介戒菸服務', '轉介戒酒資源', '戒除檳榔', '提供成癮治療或相關專業轉介', '減少空污、二手菸及室內污染暴露', '其他'] }],
  },
];

interface GreenPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  questionnaireTitle: string;
  submittedAt: string;
  interests: string[];
  onConfirm: (items: SelectedPrescription[]) => void;
}

const normalizeSurveyFocus = (rawValue: string): LifestyleFocus | null => {
  const value = rawValue.trim();
  if (value.includes('戒菸') || value.includes('戒酒') || value.includes('戒檳榔') || value.includes('危害物質')) return '戒菸／戒酒／戒檳榔';
  if (value.includes('人際') || value.includes('社交') || value.includes('社會連結')) return '增加人際互動';
  if (value.includes('運動') || value.includes('身體活動')) return '運動習慣';
  if (value.includes('飲食')) return '飲食習慣';
  if (value.includes('睡眠')) return '睡眠品質';
  if (value.includes('壓力')) return '壓力管理';
  return null;
};

export const GreenPrescriptionModal: React.FC<GreenPrescriptionModalProps> = ({
  isOpen,
  onClose,
  patientName,
  questionnaireTitle,
  submittedAt,
  interests,
  onConfirm,
}) => {
  const matchedGroups = useMemo(() => {
    const normalizedInterests = new Set(interests.map(normalizeSurveyFocus).filter(Boolean));
    return GROUPS.filter((group) => normalizedInterests.has(group.surveyFocus));
  }, [interests]);
  const [selectedAdvanced, setSelectedAdvanced] = useState<Set<string>>(new Set());
  const [otherText, setOtherText] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setSelectedAdvanced(new Set());
      setOtherText({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const optionKey = (group: PrescriptionGroup, section: AdvancedSection, option: string) =>
    `${group.focus}|${section.title}|${option}`;

  const toggleAdvanced = (key: string) => {
    setSelectedAdvanced((current) => {
      const next = new Set(current);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const needsCustomText = (option: string) => option === '其他' || option === '其它';
  const hasIncompleteOther = matchedGroups.some((group) =>
    group.advanced.some((section) =>
      section.options.some((option) => {
        const key = optionKey(group, section, option);
        return needsCustomText(option) && selectedAdvanced.has(key) && !otherText[key]?.trim();
      }),
    ),
  );

  const submit = () => {
    if (!matchedGroups.length || hasIncompleteOther) return;

    const basicItems: SelectedPrescription[] = matchedGroups.flatMap((group) =>
      group.basic.map((text) => ({ focus: group.focus, text, level: '基本處方', category: group.category })),
    );
    const advancedItems: SelectedPrescription[] = matchedGroups.flatMap((group) =>
      group.advanced.flatMap((section) =>
        section.options.flatMap((option) => {
          const key = optionKey(group, section, option);
          if (!selectedAdvanced.has(key)) return [];
          const value = needsCustomText(option) ? otherText[key].trim() : option;
          const text = section.title === '個別化加強處方' ? value : `${section.title}：${value}`;
          return [{ focus: group.focus, text, level: '加強處方' as const, category: group.category }];
        }),
      ),
    );

    onConfirm([...basicItems, ...advancedItems]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-zinc-900">
              <Leaf className="h-5 w-5 text-emerald-600" />
              指派綠色處方
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              個案：{patientName}・依據 {submittedAt} 填寫的「{questionnaireTitle}」
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100" aria-label="關閉">
            <X className="h-5 w-5" />
          </button>
        </header>

        <main className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-zinc-50 p-5">
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>系統已依問卷關注面向自動產出基本處方；基本處方固定納入，醫師可視個案需求勾選加強處方。</span>
          </div>

          {!matchedGroups.length ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
              此份問卷沒有可對應的生活型態關注面向，暫時無法產出處方。
            </div>
          ) : matchedGroups.map((group) => (
            <section key={group.focus} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3">
                <div>
                  <h3 className="font-black text-zinc-900">{group.focus}</h3>
                  <p className="mt-0.5 text-xs text-zinc-400">問卷選項：{group.surveyFocus}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">已由問卷帶入</span>
              </div>

              <div className="grid gap-5 p-4 lg:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-bold text-zinc-700">系統自動產出的基本處方</h4>
                  <div className="space-y-2">
                    {group.basic.map((text) => (
                      <div key={text} className="flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs leading-5 text-zinc-800">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-emerald-600 bg-emerald-600 text-white">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {group.advanced.map((section) => (
                    <div key={section.title}>
                      <h4 className="mb-2 text-sm font-bold text-zinc-700">{section.title}</h4>
                      <div className="space-y-2">
                        {section.options.map((option) => {
                          const key = optionKey(group, section, option);
                          const checked = selectedAdvanced.has(key);
                          return (
                            <div key={key}>
                              <button
                                type="button"
                                onClick={() => toggleAdvanced(key)}
                                className={`flex w-full items-start gap-2 rounded-lg border p-3 text-left text-xs leading-5 transition-colors ${checked ? 'border-[#f08327] bg-orange-50' : 'border-zinc-200 bg-white hover:border-orange-300'}`}
                              >
                                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checked ? 'border-[#f08327] bg-[#f08327] text-white' : 'border-zinc-300'}`}>
                                  {checked && <Check className="h-3.5 w-3.5" />}
                                </span>
                                <span>{option}</span>
                              </button>
                              {checked && needsCustomText(option) && (
                                <input
                                  type="text"
                                  value={otherText[key] ?? ''}
                                  onChange={(event) => setOtherText((current) => ({ ...current, [key]: event.target.value }))}
                                  placeholder="請輸入其他處方內容"
                                  className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs focus:border-[#f08327] focus:outline-none focus:ring-2 focus:ring-orange-100"
                                  autoFocus
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-6 py-4">
          <span className="text-sm text-zinc-500">
            基本處方 {matchedGroups.reduce((sum, group) => sum + group.basic.length, 0)} 項・加強處方已選 {selectedAdvanced.size} 項
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-zinc-300 px-5 py-2 text-sm font-bold text-zinc-600">取消</button>
            <button
              type="button"
              onClick={submit}
              disabled={!matchedGroups.length || hasIncompleteOther}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              確認指派
            </button>
          </div>
          {hasIncompleteOther && <p className="w-full text-right text-xs font-medium text-red-600">請填寫「其他」處方內容後再確認。</p>}
        </footer>
      </div>
    </div>
  );
};
