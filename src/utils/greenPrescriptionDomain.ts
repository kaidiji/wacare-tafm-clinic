import {
  CaseItem,
  ExercisePrescriptionDetails,
  HistoricalCourseItem,
  HistoricalPrescriptionItem,
  PrescriptionExecutionCycle,
  PrescriptionTask,
  QuestionnaireRecord,
} from '../types';
import { synchronizePrescriptionStatus } from './greenPrescriptionMetrics';

export interface PrescriptionSelection {
  definitionId: string;
  taskId?: string;
  prescriptionId?: string;
  focus: string;
  text: string;
  level: '基本處方' | '加強處方';
  category: PrescriptionTask['category'];
  exercisePrescription?: ExercisePrescriptionDetails;
}

export function formatExercisePrescription({
  exerciseType,
  frequency,
  duration,
}: ExercisePrescriptionDetails): string {
  const frequencyConnector = frequency === '每天' ? '' : '中';
  return `${frequency}${frequencyConnector}進行${duration}的${exerciseType}`;
}

export function parseQuestionnaireDate(value: string): number {
  const match = value.trim().match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return Number.NEGATIVE_INFINITY;
  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) return Number.NEGATIVE_INFINITY;
  return date.getTime();
}

export function getQuestionnaireHistory(caseItem: CaseItem): QuestionnaireRecord[] {
  const records = caseItem.questionnaireHistory?.length
    ? caseItem.questionnaireHistory
    : caseItem.lifestyleSurvey
      ? [{
          id: `legacy-lifestyle-${caseItem.id}`,
          title: '生活型態問卷',
          submittedAt: caseItem.lifestyleSurvey.submittedAt,
          status: 'completed' as const,
          interests: caseItem.lifestyleSurvey.interests,
        }]
      : [];

  return [...records].sort((a, b) => parseQuestionnaireDate(b.submittedAt) - parseQuestionnaireDate(a.submittedAt));
}

export function formatLocalPrescriptionDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

export function formatLocalPrescriptionDateTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${formatLocalPrescriptionDate(date)} ${hours}:${minutes}`;
}

export function hasQuestionnaireAssignment(prescriptions: PrescriptionTask[], questionnaireId: string): boolean {
  return prescriptions.some((task) => task.sourceQuestionnaireId === questionnaireId);
}

export function reconcileQuestionnairePrescriptions({
  caseItem,
  questionnaire,
  selections,
  assignedBy,
  now,
}: {
  caseItem: CaseItem;
  questionnaire: QuestionnaireRecord;
  selections: PrescriptionSelection[];
  assignedBy: string;
  now: Date;
}): PrescriptionTask[] {
  const existingFromQuestionnaire = caseItem.prescriptions.filter((task) => task.sourceQuestionnaireId === questionnaire.id);
  const unaffectedTasks = caseItem.prescriptions.filter((task) => task.sourceQuestionnaireId !== questionnaire.id);
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 27);

  const uniqueSelections = Array.from(new Map(selections.map((selection) => [selection.definitionId, selection])).values());
  const questionnaireTasks = uniqueSelections.map((selection, index) => {
    const existing = selection.taskId
      ? existingFromQuestionnaire.find((task) => (task.taskId ?? task.id) === selection.taskId)
      : existingFromQuestionnaire.find((task) => task.definitionId === selection.definitionId);
    const prescriptionId = selection.prescriptionId ?? existing?.prescriptionId ?? `prescription-${questionnaire.id}`;
    const taskId = selection.taskId ?? existing?.taskId ?? existing?.id ?? `task-${questionnaire.id}-${now.getTime()}-${index}`;
    if (existing) {
      return {
        ...existing,
        id: taskId,
        taskId,
        prescriptionId,
        definitionId: selection.definitionId,
        executionKind: 'prescription' as const,
        title: selection.text,
        description: selection.text,
        exercisePrescription: selection.exercisePrescription,
        sourceQuestionnaireTitle: questionnaire.title,
        sourceQuestionnaireSubmittedAt: questionnaire.submittedAt,
      };
    }

    return {
      id: taskId,
      taskId,
      prescriptionId,
      definitionId: selection.definitionId,
      executionKind: 'prescription' as const,
      category: selection.category,
      title: selection.text,
      description: selection.text,
      frequency: '依處方內容執行',
      durationMinutes: 0,
      targetCount: 1,
      completedCount: 0,
      startDate: formatLocalPrescriptionDate(now),
      endDate: formatLocalPrescriptionDate(endDate),
      status: 'active' as const,
      courseType: 'custom' as const,
      doctorNotes: selection.level,
      assignedBy,
      assignedAt: formatLocalPrescriptionDateTime(now),
      rewardPoints: 0,
      sourceQuestionnaireId: questionnaire.id,
      sourceQuestionnaireTitle: questionnaire.title,
      sourceQuestionnaireSubmittedAt: questionnaire.submittedAt,
      prescriptionLevel: selection.level,
      prescriptionFocus: selection.focus,
      exercisePrescription: selection.exercisePrescription,
    };
  });

  return [...questionnaireTasks, ...unaffectedTasks];
}

const isTaskCompleted = (task: PrescriptionTask): boolean => {
  const targetCount = Math.max(0, Math.floor(task.targetCount));
  const completedCount = Math.min(Math.max(0, Math.floor(task.completedCount)), targetCount);
  return targetCount > 0 && completedCount >= targetCount;
};

/**
 * 結算當前執行週期：把 caseItem.prescriptions（含處方與課程）彙整成一筆歷史紀錄，
 * 並清空當前任務，讓後續指派從全新的週期開始。
 * 放棄逐筆即時記錄，改以「結算當下」為準的週期性紀錄。
 */
export function settleExecutionCycle({ caseItem, now }: { caseItem: CaseItem; now: Date }): CaseItem {
  const tasks = caseItem.prescriptions;
  if (tasks.length === 0) return caseItem;

  const expertPrescriptions: HistoricalPrescriptionItem[] = tasks
    .filter((task) => task.executionKind !== 'course')
    .map((task) => ({
      id: task.id,
      taskId: task.taskId ?? task.id,
      prescriptionId: task.prescriptionId,
      sourceQuestionnaireId: task.sourceQuestionnaireId,
      category: task.prescriptionFocus ?? task.category,
      title: task.title,
      completed: isTaskCompleted(task),
    }));

  const courses: HistoricalCourseItem[] = tasks
    .filter((task) => task.executionKind === 'course')
    .map((task) => ({
      id: task.id,
      taskId: task.taskId ?? task.id,
      prescriptionId: task.prescriptionId,
      sourceQuestionnaireId: task.sourceQuestionnaireId,
      title: task.title,
      completed: isTaskCompleted(task),
    }));

  const earliestStart = tasks.reduce(
    (earliest, task) => Math.min(earliest, parseQuestionnaireDate(task.startDate)),
    Number.POSITIVE_INFINITY,
  );
  const cycleStartDate = Number.isFinite(earliestStart) ? new Date(earliestStart) : now;
  // 結算週期的指派人取自當前處方任務本身（而非即將指派的新處方），純課程週期則不歸屬任何人。
  const assignedByTask = tasks.find((task) => task.executionKind !== 'course' && task.assignedBy);

  const cycle: PrescriptionExecutionCycle = {
    id: `execution-cycle-${caseItem.id}-${now.getTime()}`,
    startDate: formatLocalPrescriptionDate(cycleStartDate),
    endDate: formatLocalPrescriptionDate(now),
    assignedBy: assignedByTask?.assignedBy,
    expertPrescriptions,
    courses,
  };

  return {
    ...caseItem,
    executionHistory: [...(caseItem.executionHistory ?? []), cycle],
    prescriptions: [],
  };
}

const WEEKLY_COURSE_SETTLEMENT_DAYS = 7;

/**
 * 純影片觀看（尚未經醫師指派處方）的週期每 7 天自動結算一次；
 * 一旦有醫師指派的處方，則改由指派當下立即結算（見 settleExecutionCycle 的呼叫端）。
 */
export function settleDueCourseOnlyExecutionCycle(caseItem: CaseItem, now: Date): CaseItem {
  const tasks = caseItem.prescriptions;
  if (tasks.length === 0) return caseItem;

  const hasDoctorPrescription = tasks.some((task) => task.executionKind !== 'course');
  if (hasDoctorPrescription) return caseItem;

  const earliestStart = tasks.reduce(
    (earliest, task) => Math.min(earliest, parseQuestionnaireDate(task.startDate)),
    Number.POSITIVE_INFINITY,
  );
  if (!Number.isFinite(earliestStart)) return caseItem;

  const dueAt = earliestStart + WEEKLY_COURSE_SETTLEMENT_DAYS * 24 * 60 * 60 * 1000;
  if (now.getTime() < dueAt) return caseItem;

  const settled = settleExecutionCycle({ caseItem, now });
  return { ...settled, prescriptions: ensureDefaultCourseTasks(settled, now) };
}

const DEFAULT_COURSE_VIDEO_TITLES = ['本週課程影片 1', '本週課程影片 2', '本週課程影片 3'];

function createDefaultCourseTasks(now: Date): PrescriptionTask[] {
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 6);
  return DEFAULT_COURSE_VIDEO_TITLES.map((title, index) => ({
    id: `default-course-${index + 1}`,
    taskId: `default-course-${index + 1}`,
    prescriptionId: 'default-course-weekly',
    definitionId: `default-course-${index + 1}`,
    executionKind: 'course' as const,
    category: '自我管理教育',
    title,
    description: title,
    frequency: '每週 1 次',
    durationMinutes: 0,
    targetCount: 1,
    completedCount: 0,
    startDate: formatLocalPrescriptionDate(now),
    endDate: formatLocalPrescriptionDate(endDate),
    status: 'active' as const,
    courseType: 'video' as const,
    assignedBy: '系統預設',
    assignedAt: formatLocalPrescriptionDateTime(now),
  }));
}

/** Every case gets 3 weekly course-video tasks by default; unlike prescriptions, these are not doctor-assigned. */
export function ensureDefaultCourseTasks(caseItem: CaseItem, now: Date): PrescriptionTask[] {
  const hasCourseTasks = caseItem.prescriptions.some((task) => task.executionKind === 'course');
  return hasCourseTasks ? caseItem.prescriptions : [...caseItem.prescriptions, ...createDefaultCourseTasks(now)];
}

export function migrateCaseItem(caseItem: CaseItem, now: Date = new Date()): CaseItem {
  const safeCase = {
    ...caseItem,
    prescriptions: Array.isArray(caseItem.prescriptions) ? caseItem.prescriptions.map((task) => ({
      ...task,
      taskId: task.taskId ?? task.id,
      prescriptionId: task.prescriptionId ?? (task.sourceQuestionnaireId ? `prescription-${task.sourceQuestionnaireId}` : `legacy-prescription-${task.id}`),
      definitionId: task.definitionId ?? `legacy-definition-${task.id}`,
      executionKind: task.executionKind ?? 'prescription',
    })) : [],
    executionLogs: Array.isArray(caseItem.executionLogs) ? caseItem.executionLogs : [],
    executionHistory: Array.isArray(caseItem.executionHistory) ? caseItem.executionHistory : [],
  };
  const withDefaultCourses = { ...safeCase, prescriptions: ensureDefaultCourseTasks(safeCase, now) };
  const withWeeklySettlement = settleDueCourseOnlyExecutionCycle(withDefaultCourses, now);
  return {
    ...withWeeklySettlement,
    questionnaireHistory: getQuestionnaireHistory(withWeeklySettlement),
  };
}

export function createPrototypeCases(initialCases: CaseItem[], now: Date = new Date()): CaseItem[] {
  return structuredClone(initialCases).map((caseItem) => migrateCaseItem(caseItem, now)).map(synchronizePrescriptionStatus);
}
