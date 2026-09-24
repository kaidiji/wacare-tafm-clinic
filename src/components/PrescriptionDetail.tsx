import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Leaf,
  Plus,
} from 'lucide-react';
import { CaseItem, QuestionnaireRecord } from '../types';
import { GreenPrescriptionModal, SelectedPrescription } from './GreenPrescriptionModal';
import { EditCaseModal } from './EditCaseModal';
import { CaseProfilePanel } from './CaseProfilePanel';
import { PrescriptionExecutionHistory } from './PrescriptionExecutionHistory';
import { CurrentPrescriptionExecution } from './CurrentPrescriptionExecution';
import { synchronizePrescriptionStatus } from '../utils/greenPrescriptionMetrics';
import {
  ensureDefaultCourseTasks,
  formatLocalPrescriptionDate,
  getQuestionnaireHistory,
  hasQuestionnaireAssignment,
  reconcileQuestionnairePrescriptions,
  settleExecutionCycle,
  settleDueCourseOnlyExecutionCycle,
} from '../utils/greenPrescriptionDomain';

interface PrescriptionDetailProps {
  caseItem: CaseItem;
  onBack: () => void;
  onUpdateCase: (updated: CaseItem) => void;
  onOpenMessages: () => void;
  onOpenExport: () => void;
}

export const PrescriptionDetail: React.FC<PrescriptionDetailProps> = ({
  caseItem,
  onBack,
  onUpdateCase,
  onOpenMessages,
  onOpenExport,
}) => {
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<QuestionnaireRecord | null>(null);
  const questionnaireHistory = useMemo(() => getQuestionnaireHistory(caseItem), [caseItem]);

  const handleAssignPrescriptions = (items: SelectedPrescription[]) => {
    if (!selectedQuestionnaire) return;

    const now = new Date();
    // 滿 30 天先結算；未到期則保存舊快照，並保留現行清單與累積進度，由此刻開始新的 30 天週期。
    const currentCase = settleDueCourseOnlyExecutionCycle(caseItem, now);
    const settledCase = currentCase === caseItem ? settleExecutionCycle({ caseItem, now }) : currentCase;
    const prescriptions = reconcileQuestionnairePrescriptions({
      caseItem: currentCase,
      questionnaire: selectedQuestionnaire,
      selections: items,
      assignedBy: '王志銘醫師',
      now,
    });
    const caseWithNewPrescriptions = { ...settledCase, prescriptions };
    const finalPrescriptions = ensureDefaultCourseTasks(caseWithNewPrescriptions, now);

    onUpdateCase(synchronizePrescriptionStatus({
      ...caseWithNewPrescriptions,
      prescriptions: finalPrescriptions,
      prescriptionStatus: {
        ...caseItem.prescriptionStatus,
        lastAssignedDate: formatLocalPrescriptionDate(now),
      },
    }));
  };

  const selectedQuestionnairePrescriptions = selectedQuestionnaire
    ? caseItem.prescriptions.filter((task) => task.sourceQuestionnaireId === selectedQuestionnaire.id)
    : [];

  return (
    <div id="prescription-detail-view" className="w-full space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs">
        <button
          id="back-to-overview-btn"
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-zinc-700 transition-colors hover:text-[#f08327]"
        >
          <ArrowLeft className="h-5 w-5 text-[#f08327]" />
          返回個案總覽
        </button>
        <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-[#f08327]">
          {caseItem.nickname || caseItem.name}（#{caseItem.code}）
        </span>
      </div>

      <div className="grid min-w-0 gap-2.5 lg:grid-cols-[minmax(235px,3fr)_minmax(0,9fr)]">
        <CaseProfilePanel
          caseItem={caseItem}
          onEdit={() => setShowEditProfileModal(true)}
          onOpenMessages={onOpenMessages}
          onOpenExport={onOpenExport}
        />

        <div className="min-w-0 space-y-5">

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-md">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-zinc-900">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
              問卷填寫紀錄
            </h2>
            <p className="mt-1 text-xs text-zinc-500">依填寫時間由新到舊呈現，可依任一份生活型態問卷指派或編輯處方。</p>
          </div>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600">共 {questionnaireHistory.length} 份</span>
        </div>

        {questionnaireHistory.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
            使用者尚未完成任何問卷，完成生活型態問卷後才能指派處方。
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200">
            {questionnaireHistory.map((questionnaire, index) => {
              const hasAssignment = hasQuestionnaireAssignment(caseItem.prescriptions, questionnaire.id);
              return (
              <div
                key={questionnaire.id}
                data-questionnaire-record-id={questionnaire.id}
                data-questionnaire-assigned={String(hasAssignment)}
                className={`flex flex-col items-stretch gap-4 p-4 sm:flex-row sm:items-center ${index ? 'border-t border-zinc-100' : ''}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-900">{questionnaire.title}</h3>
                    {index === 0 && <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-[#f08327]">最新</span>}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500"><CalendarDays className="h-3.5 w-3.5" />{questionnaire.submittedAt}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1.5 text-[11px] font-bold text-zinc-400">問卷關注面向</p>
                  <div className="flex flex-wrap gap-1.5">
                    {questionnaire.interests.map((interest) => (
                      <span key={interest} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{interest}</span>
                    ))}
                  </div>
                </div>
                {hasAssignment ? (
                  <span
                    data-questionnaire-action-id={questionnaire.id}
                    className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 sm:w-auto"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    已指派
                  </span>
                ) : (
                  <button
                    type="button"
                    data-questionnaire-action-id={questionnaire.id}
                    onClick={() => setSelectedQuestionnaire(questionnaire)}
                    className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#f08327] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#d96e19] sm:w-auto"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    指派處方
                  </button>
                )}
              </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-md">
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-lg font-black text-zinc-900">
            <Leaf className="h-5 w-5 text-emerald-600" />
            處方執行紀錄
          </h2>
          <p className="mt-1 text-xs text-zinc-500">查看本期任務與過往執行週期。</p>
        </div>

        <CurrentPrescriptionExecution
          tasks={caseItem.prescriptions}
        />

        <PrescriptionExecutionHistory cycles={caseItem.executionHistory ?? []} />

        {caseItem.executionLogs.length > 0 && <div className="mt-6 border-t border-zinc-200 pt-5">
          <h3 className="mb-3 text-sm font-black text-zinc-900">使用者完成紀錄</h3>
          <div className="space-y-2">
            {caseItem.executionLogs.map((log) => (
              <div key={log.id} className="rounded-lg bg-zinc-50 p-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="font-bold text-zinc-800">{log.taskTitle}</span>
                  <span className="text-zinc-500">{log.category}</span>
                  <span className="text-zinc-500">執行內容：{log.durationMinutes > 0 ? `${log.durationMinutes} 分鐘` : '已完成回報'}</span>
                  <span className="ml-auto text-zinc-400">{log.date}</span>
                </div>
                {(log.userNote || log.doctorFeedback) && (
                  <div className="mt-2 space-y-1 border-t border-zinc-200 pt-2 text-zinc-500">
                    {log.userNote && <p>使用者備註：{log.userNote}</p>}
                    {log.doctorFeedback && <p>醫師回饋：{log.doctorFeedback}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>}
      </section>
        </div>
      </div>

      <GreenPrescriptionModal
        isOpen={!!selectedQuestionnaire}
        onClose={() => setSelectedQuestionnaire(null)}
        patientName={caseItem.nickname || caseItem.name}
        questionnaireTitle={selectedQuestionnaire?.title ?? ''}
        submittedAt={selectedQuestionnaire?.submittedAt ?? ''}
        interests={selectedQuestionnaire?.interests ?? []}
        existingPrescriptions={selectedQuestionnairePrescriptions}
        onConfirm={handleAssignPrescriptions}
      />

      <EditCaseModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        caseItem={caseItem}
        onSaveCase={onUpdateCase}
      />
    </div>
  );
};
