import React, { useEffect, useMemo, useState } from 'react';
import { Check, Info, Leaf, X } from 'lucide-react';
import { ExercisePrescriptionDetails, PrescriptionTask } from '../types';
import {
  AdvancedPrescriptionSection,
  getPrescriptionGroupsForInterests,
  GreenPrescriptionGroup,
} from '../utils/greenPrescriptionCatalog';
import { formatExercisePrescription, PrescriptionSelection } from '../utils/greenPrescriptionDomain';

export type SelectedPrescription = PrescriptionSelection;

type ExerciseField = keyof ExercisePrescriptionDetails;
type ExerciseDraft = ExercisePrescriptionDetails & { customExerciseType: string };

const EMPTY_EXERCISE_DRAFT: ExerciseDraft = {
  exerciseType: '',
  frequency: '',
  duration: '',
  customExerciseType: '',
};

const exerciseFieldBySection: Record<string, ExerciseField> = {
  推薦運動: 'exerciseType',
  運動類型: 'exerciseType',
  運動頻率: 'frequency',
  建議頻率: 'frequency',
  每次運動時間: 'duration',
  每次時間: 'duration',
};

const normalizeLegacyExerciseValue = (field: ExerciseField, value: string) => {
  if (field === 'frequency') return value.replace(/(\d)\s*-\s*(\d)/, '$1~$2');
  if (field === 'duration') return value.replace(/\s+/g, '');
  return value;
};

const basicDefinitionId = (group: GreenPrescriptionGroup, index: number) =>
  `${group.surveyFocus}-basic-${index + 1}`;
const advancedDefinitionId = (group: GreenPrescriptionGroup, sectionIndex: number, optionIndex: number) =>
  `${group.surveyFocus}-advanced-${sectionIndex + 1}-${optionIndex + 1}`;
const exerciseDefinitionId = (group: GreenPrescriptionGroup) => `${group.surveyFocus}-exercise-plan`;

interface GreenPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  questionnaireTitle: string;
  submittedAt: string;
  interests: string[];
  existingPrescriptions?: PrescriptionTask[];
  onConfirm: (items: SelectedPrescription[]) => void;
}

export const GreenPrescriptionModal: React.FC<GreenPrescriptionModalProps> = ({
  isOpen,
  onClose,
  patientName,
  questionnaireTitle,
  submittedAt,
  interests,
  existingPrescriptions = [],
  onConfirm,
}) => {
  const matchedGroups = useMemo(() => getPrescriptionGroupsForInterests(interests), [interests]);
  const [selectedAdvanced, setSelectedAdvanced] = useState<Set<string>>(new Set());
  const [otherText, setOtherText] = useState<Record<string, string>>({});
  const [exerciseDrafts, setExerciseDrafts] = useState<Record<string, ExerciseDraft>>({});

  const optionKey = (group: GreenPrescriptionGroup, section: AdvancedPrescriptionSection, option: string) =>
    `${group.focus}|${section.title}|${option}`;

  useEffect(() => {
    if (!isOpen) return;

    const restoredSelections = new Set<string>();
    const restoredOtherText: Record<string, string> = {};
    const restoredExerciseDrafts: Record<string, ExerciseDraft> = {};
    matchedGroups.forEach((group) => {
      const existingForGroup = existingPrescriptions.filter(
        (task) => task.prescriptionLevel === '加強處方' && task.prescriptionFocus === group.focus,
      );
      if (group.focus === '身體活動') {
        const draft = { ...EMPTY_EXERCISE_DRAFT };
        const structured = existingForGroup.find(
          (task) => task.definitionId === exerciseDefinitionId(group) || !!task.exercisePrescription,
        )?.exercisePrescription;
        if (structured) {
          const exerciseTypeOptions = group.advanced.find((section) => exerciseFieldBySection[section.title] === 'exerciseType')?.options ?? [];
          const knownExerciseType = exerciseTypeOptions.includes(structured.exerciseType);
          draft.exerciseType = knownExerciseType ? structured.exerciseType : '其他';
          draft.customExerciseType = knownExerciseType ? '' : structured.exerciseType;
          draft.frequency = normalizeLegacyExerciseValue('frequency', structured.frequency);
          draft.duration = normalizeLegacyExerciseValue('duration', structured.duration);
        }
        restoredExerciseDrafts[group.focus] = draft;
        return;
      }
      group.advanced.forEach((section, sectionIndex) => {
        section.options.forEach((option, optionIndex) => {
          const task = existingForGroup.find(
            (item) => item.definitionId === advancedDefinitionId(group, sectionIndex, optionIndex),
          );
          if (!task) return;
          const key = optionKey(group, section, option);
          restoredSelections.add(key);
          if (needsCustomText(option)) restoredOtherText[key] = task.description;
        });
      });
    });
    setSelectedAdvanced(restoredSelections);
    setOtherText(restoredOtherText);
    setExerciseDrafts(restoredExerciseDrafts);
  }, [existingPrescriptions, isOpen, matchedGroups]);

  if (!isOpen) return null;

  const toggleAdvanced = (key: string) => {
    setSelectedAdvanced((current) => {
      const next = new Set(current);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const updateExerciseDraft = (focus: string, field: keyof ExerciseDraft, value: string) => {
    setExerciseDrafts((current) => ({
      ...current,
      [focus]: {
        ...(current[focus] ?? EMPTY_EXERCISE_DRAFT),
        [field]: value,
        ...(field === 'exerciseType' && value !== '其他' ? { customExerciseType: '' } : {}),
      },
    }));
  };

  const needsCustomText = (option: string) => option === '其他' || option === '其它';
  const hasIncompleteOther = matchedGroups.some((group) =>
    group.focus !== '身體活動' &&
    group.advanced.some((section) =>
      section.options.some((option) => {
        const key = optionKey(group, section, option);
        return needsCustomText(option) && selectedAdvanced.has(key) && !otherText[key]?.trim();
      }),
    ),
  );
  const hasIncompleteExercise = matchedGroups.some((group) => {
    if (group.focus !== '身體活動') return false;
    const draft = exerciseDrafts[group.focus] ?? EMPTY_EXERCISE_DRAFT;
    const hasStarted = Boolean(draft.exerciseType || draft.frequency || draft.duration || draft.customExerciseType.trim());
    if (!hasStarted) return false;
    return !draft.exerciseType || !draft.frequency || !draft.duration || (draft.exerciseType === '其他' && !draft.customExerciseType.trim());
  });
  const completedExerciseSelectionCount = matchedGroups.filter((group) => {
    if (group.focus !== '身體活動') return false;
    const draft = exerciseDrafts[group.focus] ?? EMPTY_EXERCISE_DRAFT;
    return Boolean(draft.exerciseType && draft.frequency && draft.duration && (draft.exerciseType !== '其他' || draft.customExerciseType.trim()));
  }).length;
  const hasIncompleteSelection = hasIncompleteOther || hasIncompleteExercise;

  const submit = () => {
    if (!matchedGroups.length || hasIncompleteSelection) return;

    const basicItems: SelectedPrescription[] = matchedGroups.flatMap((group) =>
      group.basic.map((text, index) => {
        const definitionId = basicDefinitionId(group, index);
        const existing = existingPrescriptions.find((task) => task.definitionId === definitionId);
        return {
          definitionId,
          taskId: existing?.taskId ?? existing?.id,
          prescriptionId: existing?.prescriptionId,
          focus: group.focus,
          text,
          level: '基本處方',
          category: group.category,
        };
      }),
    );
    const advancedItems: SelectedPrescription[] = matchedGroups.flatMap((group) =>
      group.focus === '身體活動'
        ? (() => {
            const draft = exerciseDrafts[group.focus] ?? EMPTY_EXERCISE_DRAFT;
            if (!draft.exerciseType && !draft.frequency && !draft.duration) return [];
            if (!draft.exerciseType || !draft.frequency || !draft.duration) return [];
            const exercisePrescription: ExercisePrescriptionDetails = {
              exerciseType: draft.exerciseType === '其他' ? draft.customExerciseType.trim() : draft.exerciseType,
              frequency: draft.frequency,
              duration: draft.duration,
            };
            const definitionId = exerciseDefinitionId(group);
            const existing = existingPrescriptions.find(
              (task) => task.definitionId === definitionId || !!task.exercisePrescription,
            );
            return [{
              definitionId,
              taskId: existing?.taskId ?? existing?.id,
              prescriptionId: existing?.prescriptionId,
              focus: group.focus,
              text: formatExercisePrescription(exercisePrescription),
              level: '加強處方' as const,
              category: group.category,
              exercisePrescription,
            }];
          })()
        : group.advanced.flatMap((section, sectionIndex) =>
        section.options.flatMap((option, optionIndex) => {
          const key = optionKey(group, section, option);
          if (!selectedAdvanced.has(key)) return [];
          const definitionId = advancedDefinitionId(group, sectionIndex, optionIndex);
          const existing = existingPrescriptions.find((task) => task.definitionId === definitionId);
          const value = needsCustomText(option) ? otherText[key].trim() : option;
          const text = section.title === '個別化加強處方' ? value : `${section.title}：${value}`;
          return [{
            definitionId,
            taskId: existing?.taskId ?? existing?.id,
            prescriptionId: existing?.prescriptionId,
            focus: group.focus,
            text,
            level: '加強處方' as const,
            category: group.category,
          }];
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
                  {group.focus === '身體活動' ? group.advanced.map((section) => {
                    const field = exerciseFieldBySection[section.title];
                    if (!field) return null;
                    const draft = exerciseDrafts[group.focus] ?? EMPTY_EXERCISE_DRAFT;
                    const hasStarted = Boolean(draft.exerciseType || draft.frequency || draft.duration || draft.customExerciseType.trim());
                    const fieldIsIncomplete = hasStarted && (!draft[field] || (field === 'exerciseType' && draft[field] === '其他' && !draft.customExerciseType.trim()));
                    return (
                      <fieldset key={section.title}>
                        <legend className="mb-2 text-sm font-bold text-zinc-700">{section.title}</legend>
                        <div className="space-y-2">
                          {section.options.map((option) => {
                            const checked = draft[field] === option;
                            return (
                              <div key={option}>
                                <label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-left text-xs leading-5 transition-colors ${checked ? 'border-[#f08327] bg-orange-50' : 'border-zinc-200 bg-white hover:border-orange-300'}`}>
                                  <input
                                    type="radio"
                                    name={`exercise-${group.focus}-${field}`}
                                    value={option}
                                    checked={checked}
                                    onChange={() => updateExerciseDraft(group.focus, field, option)}
                                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#f08327]"
                                  />
                                  <span>{option}</span>
                                </label>
                                {field === 'exerciseType' && option === '其他' && checked && (
                                  <input
                                    type="text"
                                    value={draft.customExerciseType}
                                    onChange={(event) => updateExerciseDraft(group.focus, 'customExerciseType', event.target.value)}
                                    placeholder="請輸入推薦運動"
                                    className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs focus:border-[#f08327] focus:outline-none focus:ring-2 focus:ring-orange-100"
                                    autoFocus
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {fieldIsIncomplete && <p className="mt-2 text-xs font-medium text-red-600">請選擇{section.title}。</p>}
                      </fieldset>
                    );
                  }) : group.advanced.map((section) => (
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
            基本處方 {matchedGroups.reduce((sum, group) => sum + group.basic.length, 0)} 項・加強處方已選 {selectedAdvanced.size + completedExerciseSelectionCount} 項
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-zinc-300 px-5 py-2 text-sm font-bold text-zinc-600">取消</button>
            <button
              type="button"
              onClick={submit}
              disabled={!matchedGroups.length || hasIncompleteSelection}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              確認指派
            </button>
          </div>
          {hasIncompleteOther && <p className="w-full text-right text-xs font-medium text-red-600">請填寫「其他」處方內容後再確認。</p>}
          {hasIncompleteExercise && <p className="w-full text-right text-xs font-medium text-red-600">請完成推薦運動、運動頻率與每次運動時間後再確認。</p>}
        </footer>
      </div>
    </div>
  );
};
