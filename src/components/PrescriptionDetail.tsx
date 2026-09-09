import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  Edit3,
  FileText,
  Leaf,
  MessageSquare,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react';
import { CaseItem, PrescriptionTask, QuestionnaireRecord } from '../types';
import { CATEGORY_COLORS } from '../data/mockCases';
import { GreenPrescriptionModal, SelectedPrescription } from './GreenPrescriptionModal';
import { EditCaseModal } from './EditCaseModal';
import { calculateGreenPrescriptionMetrics, synchronizePrescriptionStatus } from '../utils/greenPrescriptionMetrics';

interface PrescriptionDetailProps {
  caseItem: CaseItem;
  onBack: () => void;
  onUpdateCase: (updated: CaseItem) => void;
  onOpenMessages: () => void;
}

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

const getQuestionnaireHistory = (caseItem: CaseItem): QuestionnaireRecord[] => {
  if (caseItem.questionnaireHistory?.length) {
    return [...caseItem.questionnaireHistory].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }
  if (caseItem.lifestyleSurvey) {
    return [{
      id: `legacy-lifestyle-${caseItem.id}`,
      title: '生活型態問卷',
      submittedAt: caseItem.lifestyleSurvey.submittedAt,
      status: 'completed',
      interests: caseItem.lifestyleSurvey.interests,
    }];
  }
  return [];
};

export const PrescriptionDetail: React.FC<PrescriptionDetailProps> = ({
  caseItem,
  onBack,
  onUpdateCase,
  onOpenMessages,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<QuestionnaireRecord | null>(null);
  const questionnaireHistory = useMemo(() => getQuestionnaireHistory(caseItem), [caseItem]);
  const latestQuestionnaire = questionnaireHistory[0] ?? null;
  const metrics = useMemo(() => calculateGreenPrescriptionMetrics(caseItem), [caseItem]);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(caseItem.code);
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAssignPrescriptions = (items: SelectedPrescription[]) => {
    if (!selectedQuestionnaire) return;

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 27);
    const existingFromQuestionnaire = caseItem.prescriptions.filter(
      (task) => task.sourceQuestionnaireId === selectedQuestionnaire.id,
    );
    const unaffectedTasks = caseItem.prescriptions.filter(
      (task) => task.sourceQuestionnaireId !== selectedQuestionnaire.id,
    );

    const questionnaireTasks: PrescriptionTask[] = items.map((item, index) => {
      const existing = existingFromQuestionnaire.find(
        (task) =>
          task.prescriptionFocus === item.focus &&
          task.prescriptionLevel === item.level &&
          task.description === item.text,
      );

      return existing ?? {
        id: `green-${selectedQuestionnaire.id}-${now.getTime()}-${index}`,
        category: item.category,
        title: item.text,
        description: item.text,
        frequency: '依處方內容執行',
        durationMinutes: 0,
        targetCount: 1,
        completedCount: 0,
        startDate: formatDate(now),
        endDate: formatDate(endDate),
        status: 'active',
        courseType: 'custom',
        doctorNotes: item.level,
        assignedBy: '示範診所',
        assignedAt: now.toLocaleString('zh-TW', { hour12: false }),
        rewardPoints: 0,
        sourceQuestionnaireId: selectedQuestionnaire.id,
        prescriptionLevel: item.level,
        prescriptionFocus: item.focus,
      };
    });

    onUpdateCase(synchronizePrescriptionStatus({
      ...caseItem,
      prescriptions: [...questionnaireTasks, ...unaffectedTasks],
      prescriptionStatus: {
        ...caseItem.prescriptionStatus,
        lastAssignedDate: formatDate(now),
      },
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    if (!window.confirm('確定要刪除這項處方嗎？')) return;
    onUpdateCase(synchronizePrescriptionStatus({
      ...caseItem,
      prescriptions: caseItem.prescriptions.filter((task) => task.id !== taskId),
    }));
  };

  const hasLatestQuestionnaireAssignment = latestQuestionnaire
    ? caseItem.prescriptions.some((task) => task.sourceQuestionnaireId === latestQuestionnaire.id)
    : false;

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

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-md">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-orange-100 bg-orange-50">
            <UserRound className="h-8 w-8 text-[#f08327]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-zinc-900">{caseItem.nickname || caseItem.name}</h1>
              <span className="text-sm text-zinc-400">{caseItem.gender}・{caseItem.age} 歲</span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">{caseItem.program}・收案時間 {caseItem.enrolledDate}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-zinc-500">
              <span>姓名：{caseItem.name}</span>
              <span>身分證：{caseItem.idNumber || '尚無資料'}</span>
              <span className="flex items-center gap-1">
                個人代碼：{caseItem.code}
                <button type="button" onClick={handleCopyCode} className="rounded p-1 hover:bg-zinc-100" aria-label="複製個人代碼">
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowEditProfileModal(true)} className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50">
              <Edit3 className="h-4 w-4" />編輯資料
            </button>
            <button type="button" onClick={onOpenMessages} className="flex items-center gap-1.5 rounded-lg border border-[#f08327] px-3 py-2 text-xs font-bold text-[#f08327] hover:bg-orange-50">
              <MessageSquare className="h-4 w-4" />傳送訊息
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-md">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-zinc-900">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
              問卷填寫紀錄
            </h2>
            <p className="mt-1 text-xs text-zinc-500">依填寫時間由新到舊呈現，處方將以最新一份生活型態問卷產出。</p>
          </div>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600">共 {questionnaireHistory.length} 份</span>
        </div>

        {questionnaireHistory.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
            使用者尚未完成任何問卷，完成生活型態問卷後才能指派處方。
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200">
            {questionnaireHistory.map((questionnaire, index) => (
              <div key={questionnaire.id} className={`flex flex-wrap items-center gap-4 p-4 ${index ? 'border-t border-zinc-100' : ''}`}>
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
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-4 w-4" />已完成</span>
              </div>
            ))}

            <div className="border-t border-zinc-200 bg-zinc-50 p-4">
              <button
                id="btn-assign-prescription"
                type="button"
                disabled={!latestQuestionnaire}
                onClick={() => setSelectedQuestionnaire(latestQuestionnaire)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                {hasLatestQuestionnaireAssignment ? '依最新問卷重新指派處方' : '依最新問卷指派處方'}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-md">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-zinc-900">
              <Leaf className="h-5 w-5 text-emerald-600" />
              處方執行紀錄
            </h2>
            <p className="mt-1 text-xs text-zinc-500">查看已指派處方、使用者完成進度與處方類型。</p>
          </div>
          <div className="flex gap-2 text-xs font-bold">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-600">{metrics.assignedTaskCount} 項處方</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">達成率 {metrics.completionRate}%</span>
          </div>
        </div>

        {caseItem.prescriptions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
            <Leaf className="mx-auto h-8 w-8 text-zinc-300" />
            <p className="mt-2 text-sm font-bold text-zinc-500">目前尚未指派綠色處方</p>
            <p className="mt-1 text-xs text-zinc-400">請由上方問卷填寫紀錄的最後一個按鈕開始指派。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {caseItem.prescriptions.map((task) => {
              const style = CATEGORY_COLORS[task.category] ?? { bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-300' };
              const progress = task.targetCount > 0 ? Math.min(100, Math.round((task.completedCount / task.targetCount) * 100)) : 0;
              return (
                <article key={task.id} className="rounded-xl border border-zinc-200 p-4 transition-colors hover:border-orange-300">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${style.bg} ${style.text} ${style.border}`}>{task.prescriptionFocus || task.category}</span>
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${task.prescriptionLevel === '加強處方' ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {task.prescriptionLevel || task.doctorNotes || '既有處方'}
                        </span>
                        <span className={`flex items-center gap-1 text-xs font-bold ${task.status === 'completed' ? 'text-emerald-600' : 'text-zinc-500'}`}>
                          {task.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {task.status === 'completed' ? '已完成' : '執行中'}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-bold text-zinc-900">{task.title}</h3>
                      <p className="mt-1 text-xs text-zinc-500">指派時間：{task.assignedAt}・執行期間：{task.startDate}～{task.endDate}</p>
                    </div>
                    <button type="button" onClick={() => handleDeleteTask(task.id)} className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600" aria-label="刪除處方">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-full rounded-full bg-linear-to-r from-[#f08327] to-emerald-500" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="w-24 text-right text-xs font-bold text-zinc-600">{task.completedCount}/{task.targetCount}（{progress}%）</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {caseItem.executionLogs.length > 0 && (
          <div className="mt-6 border-t border-zinc-200 pt-5">
            <h3 className="mb-3 text-sm font-black text-zinc-900">使用者完成紀錄</h3>
            <div className="space-y-2">
              {caseItem.executionLogs.map((log) => (
                <div key={log.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-zinc-50 p-3 text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="font-bold text-zinc-800">{log.taskTitle}</span>
                  <span className="text-zinc-500">{log.category}</span>
                  <span className="ml-auto text-zinc-400">{log.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <GreenPrescriptionModal
        isOpen={!!selectedQuestionnaire}
        onClose={() => setSelectedQuestionnaire(null)}
        patientName={caseItem.nickname || caseItem.name}
        questionnaireTitle={selectedQuestionnaire?.title ?? ''}
        submittedAt={selectedQuestionnaire?.submittedAt ?? ''}
        interests={selectedQuestionnaire?.interests ?? []}
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
