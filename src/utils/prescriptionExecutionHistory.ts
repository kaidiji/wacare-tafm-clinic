import { HistoricalPrescriptionItem, PrescriptionExecutionCycle } from '../types';

export const HISTORY_CATEGORY_ORDER = [
  '飲食習慣',
  '身體活動',
  '睡眠品質',
  '壓力管理',
  '正向互動',
  '戒菸／戒酒／戒檳榔',
] as const;

export type HistoryCategoryLabel = typeof HISTORY_CATEGORY_ORDER[number];

const categoryAliases: Record<string, HistoryCategoryLabel> = {
  diet: '飲食習慣',
  飲食: '飲食習慣',
  飲食習慣: '飲食習慣',
  activity: '身體活動',
  physical_activity: '身體活動',
  運動: '身體活動',
  運動習慣: '身體活動',
  身體活動: '身體活動',
  sleep: '睡眠品質',
  sleep_quality: '睡眠品質',
  睡眠: '睡眠品質',
  睡眠品質: '睡眠品質',
  stress: '壓力管理',
  stress_management: '壓力管理',
  壓力管理: '壓力管理',
  social: '正向互動',
  positive_social_connection: '正向互動',
  社會連結: '正向互動',
  增加人際互動: '正向互動',
  正向社會連結: '正向互動',
  正向互動: '正向互動',
  substance: '戒菸／戒酒／戒檳榔',
  harmful_substance_avoidance: '戒菸／戒酒／戒檳榔',
  避免危害物質使用: '戒菸／戒酒／戒檳榔',
  戒菸戒酒戒檳榔: '戒菸／戒酒／戒檳榔',
};

const normalizeCategoryKey = (value: string) => value.trim().replace(/[／/\s]/g, '');

export function getHistoryCategoryLabel(category: string): HistoryCategoryLabel | null {
  return categoryAliases[category.trim()] ?? categoryAliases[normalizeCategoryKey(category)] ?? null;
}

export interface PrescriptionExecutionCycleSummary {
  expertCompleted: number;
  expertTotal: number;
  courseCompleted: number;
  courseTotal: number;
  completedTotal: number;
  totalCount: number;
  incompleteTotal: number;
  overallRate: number;
}

export function calculatePrescriptionExecutionCycleSummary(
  cycle: PrescriptionExecutionCycle,
): PrescriptionExecutionCycleSummary {
  const expertPrescriptions = Array.isArray(cycle.expertPrescriptions) ? cycle.expertPrescriptions : [];
  const courses = Array.isArray(cycle.courses) ? cycle.courses : [];
  const expertCompleted = expertPrescriptions.filter((item) => item.completed).length;
  const expertTotal = expertPrescriptions.length;
  const courseCompleted = courses.filter((item) => item.completed).length;
  const courseTotal = courses.length;
  const completedTotal = expertCompleted + courseCompleted;
  const totalCount = expertTotal + courseTotal;
  const incompleteTotal = Math.max(0, totalCount - completedTotal);
  const overallRate = totalCount === 0
    ? 0
    : Math.min(100, Math.max(0, Math.round((completedTotal / totalCount) * 100)));

  return {
    expertCompleted,
    expertTotal,
    courseCompleted,
    courseTotal,
    completedTotal,
    totalCount,
    incompleteTotal,
    overallRate,
  };
}

const parseCycleDate = (value: string): number => {
  const match = value.trim().match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!match) return Number.NEGATIVE_INFINITY;
  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return parsed.getFullYear() === Number(year) && parsed.getMonth() === Number(month) - 1 && parsed.getDate() === Number(day)
    ? parsed.getTime()
    : Number.NEGATIVE_INFINITY;
};

export function sortPrescriptionExecutionCycles(
  cycles: PrescriptionExecutionCycle[],
): PrescriptionExecutionCycle[] {
  return [...cycles].sort((a, b) => {
    const byStartDate = parseCycleDate(b.startDate) - parseCycleDate(a.startDate);
    return byStartDate || parseCycleDate(b.endDate) - parseCycleDate(a.endDate) || a.id.localeCompare(b.id);
  });
}

export function groupHistoricalPrescriptions(items: HistoricalPrescriptionItem[]) {
  return HISTORY_CATEGORY_ORDER.map((label) => ({
    label,
    items: items.filter((item) => getHistoryCategoryLabel(item.category) === label),
  })).filter((group) => group.items.length > 0);
}
