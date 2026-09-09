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
