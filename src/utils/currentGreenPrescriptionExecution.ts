import { PrescriptionTask } from '../types';
import { getHistoryCategoryLabel, HISTORY_CATEGORY_ORDER } from './prescriptionExecutionHistory';

export type ExecutionTaskState = 'not-started' | 'in-progress' | 'completed';

export interface CurrentExecutionTaskProgress {
  completedCount: number;
  targetCount: number;
  state: ExecutionTaskState;
}

export interface CurrentGreenPrescriptionSummary {
  prescriptionCompleted: number;
  prescriptionTotal: number;
  courseCompleted: number;
  courseTotal: number;
  completedTotal: number;
  totalCount: number;
  overallRate: number;
}

const normalizeCount = (value: number) => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

export function calculateCurrentExecutionTaskProgress(
  task: Pick<PrescriptionTask, 'targetCount' | 'completedCount'>,
): CurrentExecutionTaskProgress {
  const targetCount = normalizeCount(task.targetCount);
  const completedCount = Math.min(normalizeCount(task.completedCount), targetCount);
  const state = targetCount > 0 && completedCount >= targetCount
    ? 'completed'
    : completedCount > 0
      ? 'in-progress'
      : 'not-started';
  return { completedCount, targetCount, state };
}

export function calculateCurrentGreenPrescriptionSummary({
  tasks,
}: {
  tasks: PrescriptionTask[];
}): CurrentGreenPrescriptionSummary {
  const prescriptions = tasks.filter((task) => task.executionKind !== 'course');
  const courses = tasks.filter((task) => task.executionKind === 'course');
  const prescriptionCompleted = prescriptions.filter(
    (task) => calculateCurrentExecutionTaskProgress(task).state === 'completed',
  ).length;
  const courseCompleted = courses.filter(
    (task) => calculateCurrentExecutionTaskProgress(task).state === 'completed',
  ).length;
  const prescriptionTotal = prescriptions.length;
  const courseTotal = courses.length;
  const completedTotal = prescriptionCompleted + courseCompleted;
  const totalCount = prescriptionTotal + courseTotal;
  const overallRate = totalCount === 0
    ? 0
    : Math.min(100, Math.max(0, Math.round((completedTotal / totalCount) * 100)));
  return {
    prescriptionCompleted,
    prescriptionTotal,
    courseCompleted,
    courseTotal,
    completedTotal,
    totalCount,
    overallRate,
  };
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const parsePeriodDate = (value: string): Date | null => {
  const match = value.trim().match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatPeriodDate = (date: Date) =>
  `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}（${WEEKDAY_LABELS[date.getDay()]}）`;

/**
 * 本期日期區間，例如「2026/09/24（四）～2026/10/23（五）」。
 * 專家尚未指派處方時週期還沒開始，回傳 null（畫面留白）。
 */
export function getCurrentPeriodRangeLabel(
  tasks: Pick<PrescriptionTask, 'executionKind' | 'startDate' | 'endDate'>[],
): string | null {
  const doctorTasks = tasks.filter((task) => task.executionKind !== 'course');
  const starts = doctorTasks.map((task) => parsePeriodDate(task.startDate)).filter((date): date is Date => date !== null);
  const ends = doctorTasks.map((task) => parsePeriodDate(task.endDate)).filter((date): date is Date => date !== null);
  if (starts.length === 0 || ends.length === 0) return null;
  const start = new Date(Math.min(...starts.map((date) => date.getTime())));
  const end = new Date(Math.max(...ends.map((date) => date.getTime())));
  return `${formatPeriodDate(start)}～${formatPeriodDate(end)}`;
}

export function groupCurrentPrescriptionTasks(prescriptions: PrescriptionTask[]) {
  const groups = new Map<string, PrescriptionTask[]>();
  prescriptions.filter((task) => task.executionKind !== 'course').forEach((task) => {
    const label = getHistoryCategoryLabel(task.prescriptionFocus || task.category)
      ?? task.prescriptionFocus
      ?? task.category;
    groups.set(label, [...(groups.get(label) ?? []), task]);
  });

  const categoryOrder = new Map<string, number>(HISTORY_CATEGORY_ORDER.map((label, index) => [label, index]));
  return [...groups.entries()]
    .map(([label, tasks]) => ({ label, tasks }))
    .sort((a, b) => (categoryOrder.get(a.label) ?? Number.MAX_SAFE_INTEGER) - (categoryOrder.get(b.label) ?? Number.MAX_SAFE_INTEGER));
}
