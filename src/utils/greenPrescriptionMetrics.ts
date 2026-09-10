import { CaseItem } from '../types';
import { calculateCurrentGreenPrescriptionSummary } from './currentGreenPrescriptionExecution';

export interface GreenPrescriptionMetrics {
  assignedTaskCount: number;
  /** Doctor-assigned prescription tasks only — excludes the system-default weekly course videos. */
  assignedPrescriptionCount: number;
  targetExecutionCount: number;
  completedExecutionCount: number;
  completionRate: number;
}

const validCount = (value: number) => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

export function normalizePrescriptionProgress(task: CaseItem['prescriptions'][number]) {
  const targetCount = validCount(task.targetCount);
  const completedCount = Math.min(validCount(task.completedCount), targetCount);
  const status = targetCount > 0 && completedCount >= targetCount
    ? 'completed' as const
    : task.status === 'completed'
      ? 'active' as const
      : task.status;
  return { ...task, targetCount, completedCount, status };
}

export function calculatePrescriptionTaskProgress(task: CaseItem['prescriptions'][number]) {
  const normalized = normalizePrescriptionProgress(task);
  return {
    completedCount: normalized.completedCount,
    targetCount: normalized.targetCount,
    completionRate: normalized.targetCount > 0
      ? Math.min(100, Math.floor((normalized.completedCount / normalized.targetCount) * 100))
      : 0,
  };
}

/** Single source of truth for case overview, execution overview and analysis. */
export function calculateGreenPrescriptionMetrics(caseItem: CaseItem): GreenPrescriptionMetrics {
  const prescriptions = caseItem.prescriptions.map(normalizePrescriptionProgress);
  const summary = calculateCurrentGreenPrescriptionSummary({
    tasks: prescriptions,
  });
  return {
    assignedTaskCount: summary.totalCount,
    assignedPrescriptionCount: prescriptions.filter((task) => task.executionKind !== 'course').length,
    targetExecutionCount: summary.totalCount,
    completedExecutionCount: summary.completedTotal,
    completionRate: summary.overallRate,
  };
}

/** Keep the overview light and task data in sync after every prescription update. */
export function synchronizePrescriptionStatus(caseItem: CaseItem): CaseItem {
  const prescriptions = caseItem.prescriptions.map(normalizePrescriptionProgress);
  const normalizedCase = { ...caseItem, prescriptions };
  const metrics = calculateGreenPrescriptionMetrics(normalizedCase);
  const hasPrescription = metrics.assignedPrescriptionCount > 0;

  return {
    ...normalizedCase,
    prescriptionStatus: {
      ...caseItem.prescriptionStatus,
      hasPrescription,
      activeCount: metrics.assignedTaskCount,
      complianceRate: metrics.completionRate,
      status: !hasPrescription
        ? 'none'
        : metrics.completionRate >= 80
          ? 'good'
          : metrics.completionRate >= 50
            ? 'normal'
            : metrics.completionRate > 0
              ? 'attention'
              : 'concern',
    },
  };
}
