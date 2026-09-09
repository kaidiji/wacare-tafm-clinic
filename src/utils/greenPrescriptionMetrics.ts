import { CaseItem } from '../types';

export interface GreenPrescriptionMetrics {
  assignedTaskCount: number;
  targetExecutionCount: number;
  completedExecutionCount: number;
  completionRate: number;
}

/** Single source of truth for case overview, execution overview and analysis. */
export function calculateGreenPrescriptionMetrics(caseItem: CaseItem): GreenPrescriptionMetrics {
  const active = caseItem.prescriptions.filter((task) => task.status === 'active' || task.status === 'completed');
  const targetExecutionCount = active.reduce((sum, task) => sum + Math.max(0, task.targetCount), 0);
  const completedExecutionCount = active.reduce((sum, task) => sum + Math.min(Math.max(0, task.completedCount), Math.max(0, task.targetCount)), 0);
  const completionRate = targetExecutionCount > 0
    ? Math.min(100, Math.floor((completedExecutionCount / targetExecutionCount) * 100))
    : 0;
  return {
    assignedTaskCount: active.length,
    targetExecutionCount,
    completedExecutionCount,
    completionRate,
  };
}

/** Keep the overview light and task data in sync after every prescription update. */
export function synchronizePrescriptionStatus(caseItem: CaseItem): CaseItem {
  const metrics = calculateGreenPrescriptionMetrics(caseItem);
  const hasPrescription = metrics.assignedTaskCount > 0;

  return {
    ...caseItem,
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
