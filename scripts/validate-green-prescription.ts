import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { INITIAL_CASES } from '../src/data/mockCases';
import {
  calculateGreenPrescriptionMetrics,
  calculatePrescriptionTaskProgress,
  synchronizePrescriptionStatus,
} from '../src/utils/greenPrescriptionMetrics';
import { getPrescriptionGroupsForInterests, normalizeSurveyFocus } from '../src/utils/greenPrescriptionCatalog';
import {
  createPrototypeCases,
  ensureDefaultCourseTasks,
  formatExercisePrescription,
  getQuestionnaireHistory,
  hasExceededUnassignedCourseWindow,
  hasQuestionnaireAssignment,
  migrateCaseItem,
  reconcileQuestionnairePrescriptions,
  settleDueCourseOnlyExecutionCycle,
  settleExecutionCycle,
} from '../src/utils/greenPrescriptionDomain';
import { QuestionnaireRecord } from '../src/types';
import {
  calculatePrescriptionExecutionCycleSummary,
  getHistoryCategoryLabel,
  groupHistoricalPrescriptions,
  sortPrescriptionExecutionCycles,
} from '../src/utils/prescriptionExecutionHistory';
import {
  calculateCurrentGreenPrescriptionSummary,
  groupCurrentPrescriptionTasks,
} from '../src/utils/currentGreenPrescriptionExecution';

const cloneCase = () => structuredClone(INITIAL_CASES[0]);

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
assert.doesNotMatch(appSource, /localStorage/);
assert.doesNotMatch(appSource, /wapro-green-prescription-cases-v2/);
assert.doesNotMatch(appSource, /localStorage\.clear/);

const fixedNow = new Date(2026, 8, 9, 10, 0);
const firstPrototypeSession = createPrototypeCases(INITIAL_CASES, fixedNow);
firstPrototypeSession[0].prescriptions = [];
const refreshedPrototypeSession = createPrototypeCases(INITIAL_CASES, fixedNow);
assert.equal(refreshedPrototypeSession[0].prescriptions.length, INITIAL_CASES[0].prescriptions.length + 3);
assert.equal(refreshedPrototypeSession[0].questionnaireHistory?.length, INITIAL_CASES[0].questionnaireHistory?.length);
assert.notEqual(firstPrototypeSession, refreshedPrototypeSession);
assert.notEqual(firstPrototypeSession[0], refreshedPrototypeSession[0]);

// 每個個案預設每週應有 3 部課程影片任務(0/3)，非醫師指派
const defaultCourseTasks = refreshedPrototypeSession[0].prescriptions.filter((task) => task.executionKind === 'course');
assert.equal(defaultCourseTasks.length, 3);
assert.equal(defaultCourseTasks.every((task) => task.targetCount === 1 && task.completedCount === 0), true);
assert.equal(defaultCourseTasks.every((task) => task.assignedBy === '系統預設'), true);

// 補課程任務是「補齊到 3 筆」而非每次重算都疊加，重跑一次不應變成 6 筆
const remigratedCase = migrateCaseItem(refreshedPrototypeSession[0], fixedNow);
assert.equal(remigratedCase.prescriptions.filter((task) => task.executionKind === 'course').length, 3);

// 尚未經醫師指派前，個案本身沒有處方任務，只有預設課程，避免使用者誤以為已經指派過
const currentSummary = calculateCurrentGreenPrescriptionSummary({
  tasks: refreshedPrototypeSession[0].prescriptions,
});
assert.deepEqual(currentSummary, {
  prescriptionCompleted: 0,
  prescriptionTotal: 0,
  courseCompleted: 0,
  courseTotal: 3,
  completedTotal: 0,
  totalCount: 3,
  overallRate: 0,
});
assert.equal(groupCurrentPrescriptionTasks(refreshedPrototypeSession[0].prescriptions).length, 0);

const demoExecutionCycle = refreshedPrototypeSession[0].executionHistory?.[0];
assert.ok(demoExecutionCycle);
assert.deepEqual(calculatePrescriptionExecutionCycleSummary(demoExecutionCycle), {
  expertCompleted: 8,
  expertTotal: 15,
  courseCompleted: 2,
  courseTotal: 3,
  completedTotal: 10,
  totalCount: 18,
  incompleteTotal: 8,
  overallRate: 56,
});
assert.equal(getHistoryCategoryLabel('harmful_substance_avoidance'), '戒菸／戒酒／戒檳榔');
assert.deepEqual(
  groupHistoricalPrescriptions(demoExecutionCycle.expertPrescriptions).map((group) => group.label),
  ['飲食習慣', '身體活動', '睡眠品質', '壓力管理', '正向互動', '戒菸／戒酒／戒檳榔'],
);
assert.deepEqual(
  sortPrescriptionExecutionCycles([
    demoExecutionCycle,
    { ...demoExecutionCycle, id: 'newer-cycle', startDate: '2026/08/10', endDate: '2026/08/16' },
  ]).map((cycle) => cycle.id),
  ['newer-cycle', demoExecutionCycle.id],
);

assert.equal(normalizeSurveyFocus('戒菸 / 戒酒 / 戒檳榔'), '戒菸／戒酒／戒檳榔');
assert.equal(normalizeSurveyFocus('避免危害物質使用'), '戒菸／戒酒／戒檳榔');
assert.equal(normalizeSurveyFocus('身體活動'), '運動習慣');
assert.equal(normalizeSurveyFocus('社會連結'), '增加人際互動');
assert.deepEqual(
  getPrescriptionGroupsForInterests(['飲食習慣', '身體活動', '睡眠品質', '壓力管理', '正向社會連結', '避免危害物質使用']).map((group) => group.focus),
  ['飲食', '身體活動', '睡眠', '壓力管理', '正向社會連結', '避免危害物質使用'],
);
assert.equal(getPrescriptionGroupsForInterests([]).length, 0);

const dietGroups = getPrescriptionGroupsForInterests(['飲食習慣']);
assert.deepEqual(dietGroups.map((group) => group.focus), ['飲食']);
const activityGroup = getPrescriptionGroupsForInterests(['運動習慣'])[0];
assert.deepEqual(activityGroup.advanced.map((section) => section.title), ['推薦運動', '運動頻率', '每次運動時間']);
const exercisePrescription = {
  exerciseType: '重量訓練',
  frequency: '每週 3~4 天',
  duration: '20-30分鐘',
};
assert.equal(formatExercisePrescription(exercisePrescription), '每週 3~4 天中進行20-30分鐘的重量訓練');

const questionnaire: QuestionnaireRecord = {
  id: 'questionnaire-diet',
  title: '生活型態問卷',
  submittedAt: '2026/09/09 09:30',
  status: 'completed',
  interests: ['飲食習慣'],
};
const selections = dietGroups[0].basic.map((text, index) => ({
  definitionId: `飲食習慣-basic-${index + 1}`,
  focus: '飲食',
  text,
  level: '基本處方' as const,
  category: dietGroups[0].category,
}));
const emptyCase = { ...cloneCase(), prescriptions: [], executionLogs: [] };
const firstAssignment = reconcileQuestionnairePrescriptions({
  caseItem: emptyCase,
  questionnaire,
  selections,
  assignedBy: '測試醫師',
  now: new Date(2026, 8, 9, 10, 0),
});
assert.equal(firstAssignment.length, 4);
assert.equal(firstAssignment[0].startDate, '2026/09/09');
assert.equal(firstAssignment[0].endDate, '2026/09/13');
assert.equal(
  firstAssignment.every((task) => Boolean(task.taskId && task.prescriptionId && task.sourceQuestionnaireId)),
  true,
);
assert.deepEqual(firstAssignment.map((task) => task.title), selections.map((selection) => selection.text));
assert.equal(firstAssignment.some((task) => task.title === '減少外食頻率'), false);

const activityQuestionnaire: QuestionnaireRecord = {
  ...questionnaire,
  id: 'questionnaire-activity',
  interests: ['運動習慣'],
};
const activitySelections = [
  ...activityGroup.basic.map((text, index) => ({
    definitionId: `運動習慣-basic-${index + 1}`,
    focus: activityGroup.focus,
    text,
    level: '基本處方' as const,
    category: activityGroup.category,
  })),
  {
    definitionId: '運動習慣-exercise-plan',
    focus: activityGroup.focus,
    text: formatExercisePrescription(exercisePrescription),
    level: '加強處方' as const,
    category: activityGroup.category,
    exercisePrescription,
  },
];
const activityAssignment = reconcileQuestionnairePrescriptions({
  caseItem: emptyCase,
  questionnaire: activityQuestionnaire,
  selections: activitySelections,
  assignedBy: '測試醫師',
  now: new Date(2026, 8, 9, 10, 0),
});
const activityAdvanced = activityAssignment.filter((task) => task.prescriptionLevel === '加強處方');
assert.equal(activityAssignment.length, 3);
assert.equal(activityAdvanced.length, 1);
assert.deepEqual(activityAdvanced[0].exercisePrescription, exercisePrescription);
assert.equal(activityAdvanced[0].description, '每週 3~4 天中進行20-30分鐘的重量訓練');

const progressedActivityAssignment = activityAssignment.map((task) => task.id === activityAdvanced[0].id
  ? { ...task, completedCount: 1, status: 'completed' as const }
  : task);
const editedExercisePrescription = { ...exercisePrescription, duration: '30-60分鐘' };
const editedActivityAssignment = reconcileQuestionnairePrescriptions({
  caseItem: { ...emptyCase, prescriptions: progressedActivityAssignment },
  questionnaire: activityQuestionnaire,
  selections: activitySelections.map((selection) => selection.level === '加強處方'
    ? {
        ...selection,
        text: formatExercisePrescription(editedExercisePrescription),
        exercisePrescription: editedExercisePrescription,
      }
    : selection),
  assignedBy: '測試醫師',
  now: new Date(2026, 8, 10, 10, 0),
});
const editedActivityAdvanced = editedActivityAssignment.filter((task) => task.prescriptionLevel === '加強處方');
assert.equal(editedActivityAssignment.length, 3);
assert.equal(editedActivityAdvanced.length, 1);
assert.equal(editedActivityAdvanced[0].id, activityAdvanced[0].id);
assert.equal(editedActivityAdvanced[0].taskId, activityAdvanced[0].taskId);
assert.equal(editedActivityAdvanced[0].prescriptionId, activityAdvanced[0].prescriptionId);
assert.equal(editedActivityAdvanced[0].completedCount, 1);
assert.equal(editedActivityAdvanced[0].assignedAt, activityAdvanced[0].assignedAt);
assert.deepEqual(editedActivityAdvanced[0].exercisePrescription, editedExercisePrescription);
assert.equal(editedActivityAdvanced[0].description, '每週 3~4 天中進行30-60分鐘的重量訓練');
const editedActivitySummary = calculateCurrentGreenPrescriptionSummary({ tasks: editedActivityAssignment });
assert.equal(editedActivitySummary.prescriptionTotal, editedActivityAssignment.length);
assert.equal(editedActivitySummary.courseTotal, 0);
assert.equal(
  groupCurrentPrescriptionTasks(editedActivityAssignment).reduce((total, group) => total + group.tasks.length, 0),
  editedActivitySummary.prescriptionTotal,
);

const progressed = firstAssignment.map((task, index) => index === 0 ? { ...task, completedCount: 1, status: 'completed' as const } : task);
const renamedSelections = selections.map((selection, index) => index === 0
  ? { ...selection, text: '更新後的相同處方顯示名稱' }
  : selection);
const reassignment = reconcileQuestionnairePrescriptions({
  caseItem: { ...emptyCase, prescriptions: progressed },
  questionnaire,
  selections: renamedSelections,
  assignedBy: '測試醫師',
  now: new Date(2026, 8, 10, 10, 0),
});
assert.equal(reassignment.length, 4);
assert.equal(reassignment[0].id, progressed[0].id);
assert.equal(reassignment[0].taskId, progressed[0].taskId);
assert.equal(reassignment[0].prescriptionId, progressed[0].prescriptionId);
assert.equal(reassignment[0].completedCount, 1);
assert.equal(reassignment[0].assignedAt, progressed[0].assignedAt);
assert.equal(reassignment[0].title, '更新後的相同處方顯示名稱');
assert.equal(reassignment[0].sourceQuestionnaireId, questionnaire.id);
assert.equal(reassignment[0].sourceQuestionnaireSubmittedAt, questionnaire.submittedAt);
assert.equal(hasQuestionnaireAssignment(reassignment, questionnaire.id), true);
assert.equal(hasQuestionnaireAssignment(reassignment, 'unassigned-questionnaire'), false);

const sleepQuestionnaire: QuestionnaireRecord = {
  ...questionnaire,
  id: 'questionnaire-sleep',
  submittedAt: '2025/08/01 09:00',
  interests: ['睡眠品質'],
};
const sleepGroup = getPrescriptionGroupsForInterests(sleepQuestionnaire.interests)[0];
const sleepSelections = sleepGroup.basic.map((text, index) => ({
  definitionId: `睡眠品質-basic-${index + 1}`,
  focus: sleepGroup.focus,
  text,
  level: '基本處方' as const,
  category: sleepGroup.category,
}));
const sleepAssignment = reconcileQuestionnairePrescriptions({
  caseItem: { ...emptyCase, prescriptions: firstAssignment },
  questionnaire: sleepQuestionnaire,
  selections: sleepSelections,
  assignedBy: '測試醫師',
  now: new Date(2026, 8, 10, 11, 0),
});
const sleepIds = sleepAssignment
  .filter((task) => task.sourceQuestionnaireId === sleepQuestionnaire.id)
  .map((task) => task.id)
  .sort();
const dietEditedAlongsideSleep = reconcileQuestionnairePrescriptions({
  caseItem: { ...emptyCase, prescriptions: sleepAssignment },
  questionnaire,
  selections,
  assignedBy: '測試醫師',
  now: new Date(2026, 8, 11, 11, 0),
});
assert.equal(hasQuestionnaireAssignment(dietEditedAlongsideSleep, questionnaire.id), true);
assert.equal(hasQuestionnaireAssignment(dietEditedAlongsideSleep, sleepQuestionnaire.id), false);
assert.deepEqual(
  dietEditedAlongsideSleep
    .filter((task) => task.sourceQuestionnaireId === sleepQuestionnaire.id)
    .map((task) => task.id)
    .sort(),
  [],
);

const withAdvanced = reconcileQuestionnairePrescriptions({
  caseItem: { ...emptyCase, prescriptions: firstAssignment },
  questionnaire,
  selections: [...selections, { definitionId: '飲食習慣-advanced-1-3', focus: '飲食', text: '減少外食頻率', level: '加強處方', category: dietGroups[0].category }],
  assignedBy: '測試醫師',
  now: new Date(2026, 8, 10, 10, 0),
});
assert.equal(withAdvanced.filter((task) => task.prescriptionLevel === '加強處方').length, 1);
const removedAdvanced = reconcileQuestionnairePrescriptions({
  caseItem: { ...emptyCase, prescriptions: withAdvanced },
  questionnaire,
  selections,
  assignedBy: '測試醫師',
  now: new Date(2026, 8, 11, 10, 0),
});
assert.equal(removedAdvanced.filter((task) => task.prescriptionLevel === '加強處方').length, 0);
assert.equal(removedAdvanced.length, firstAssignment.length);

const duplicateActivitySelections = [...activitySelections, { ...activitySelections[activitySelections.length - 1] }];
const mergedActivityAssignment = reconcileQuestionnairePrescriptions({
  caseItem: emptyCase,
  questionnaire: activityQuestionnaire,
  selections: duplicateActivitySelections,
  assignedBy: '測試醫師',
  now: new Date(2026, 8, 9, 10, 0),
});
assert.equal(mergedActivityAssignment.length, activityAssignment.length);
assert.equal(mergedActivityAssignment.filter((task) => task.prescriptionLevel === '加強處方').length, 1);
const mergedSummary = calculateCurrentGreenPrescriptionSummary({ tasks: mergedActivityAssignment });
assert.equal(mergedSummary.prescriptionTotal, activityAssignment.length);
assert.equal(
  groupCurrentPrescriptionTasks(mergedActivityAssignment).reduce((total, group) => total + group.tasks.length, 0),
  mergedSummary.prescriptionTotal,
);

const layeredCase = { ...emptyCase, prescriptions: editedActivityAssignment };
const overviewMetrics = calculateGreenPrescriptionMetrics(layeredCase);
const executionSummary = calculateCurrentGreenPrescriptionSummary({ tasks: layeredCase.prescriptions });
const synchronizedLayeredCase = synchronizePrescriptionStatus(layeredCase);
assert.equal(overviewMetrics.assignedTaskCount, executionSummary.totalCount);
assert.equal(overviewMetrics.completedExecutionCount, executionSummary.completedTotal);
assert.equal(overviewMetrics.completionRate, executionSummary.overallRate);
assert.equal(synchronizedLayeredCase.prescriptionStatus.activeCount, overviewMetrics.assignedTaskCount);
assert.equal(synchronizedLayeredCase.prescriptionStatus.complianceRate, overviewMetrics.completionRate);

const historicalSnapshotBeforeEdit = structuredClone(emptyCase.executionHistory);
const currentEditDoesNotRewriteHistory = {
  ...emptyCase,
  prescriptions: editedActivityAssignment,
};
assert.deepEqual(currentEditDoesNotRewriteHistory.executionHistory, historicalSnapshotBeforeEdit);

const sorted = getQuestionnaireHistory({
  ...emptyCase,
  questionnaireHistory: [
    questionnaire,
    { ...questionnaire, id: 'older', submittedAt: '2025/1/2 08:00' },
    { ...questionnaire, id: 'newer', submittedAt: '2026-09-10 08:00' },
  ],
});
assert.deepEqual(sorted.map((record) => record.id), ['newer', 'questionnaire-diet', 'older']);
const legacyHistory = getQuestionnaireHistory({ ...emptyCase, questionnaireHistory: undefined });
assert.equal(legacyHistory.length, 1);
assert.equal(legacyHistory[0].id, `legacy-lifestyle-${emptyCase.id}`);

const capped = synchronizePrescriptionStatus({
  ...emptyCase,
  prescriptions: [{ ...firstAssignment[0], targetCount: 2, completedCount: 99 }],
});
const metrics = calculateGreenPrescriptionMetrics(capped);
assert.equal(capped.prescriptions[0].completedCount, 2);
assert.equal(metrics.completionRate, 100);
assert.deepEqual(calculatePrescriptionTaskProgress({ ...firstAssignment[0], targetCount: 7, completedCount: 5 }), {
  completedCount: 5,
  targetCount: 7,
  completionRate: 71,
});

// ---- 週期結算機制 ----

// 空任務結算為 no-op（回傳原物件參照）
const noopSettled = settleExecutionCycle({ caseItem: emptyCase, now: new Date(2026, 8, 9, 10, 0) });
assert.equal(noopSettled, emptyCase);

// 純課程週期結算：彙整成一筆歷史紀錄，且不歸屬任何指派人
const courseOnlyCase = migrateCaseItem({ ...cloneCase(), prescriptions: [], executionHistory: [] }, new Date(2026, 8, 9, 8, 0));
const courseOnlyProgressed = {
  ...courseOnlyCase,
  prescriptions: courseOnlyCase.prescriptions.map((task, index) => (index === 0 ? { ...task, completedCount: 1 } : task)),
};
const settledCourseOnly = settleExecutionCycle({ caseItem: courseOnlyProgressed, now: new Date(2026, 8, 16, 9, 0) });
assert.equal(settledCourseOnly.prescriptions.length, 0);
assert.equal(settledCourseOnly.executionHistory?.length, (courseOnlyProgressed.executionHistory?.length ?? 0) + 1);
const settledCourseCycle = settledCourseOnly.executionHistory![settledCourseOnly.executionHistory!.length - 1];
assert.equal(settledCourseCycle.expertPrescriptions.length, 0);
assert.equal(settledCourseCycle.courses.length, 3);
assert.equal(settledCourseCycle.courses.filter((course) => course.completed).length, 1);
assert.equal(settledCourseCycle.assignedBy, undefined);
assert.equal(settledCourseCycle.startDate, '2026/09/09');
assert.equal(settledCourseCycle.endDate, '2026/09/16');

// 有醫師處方的週期結算：歷史紀錄歸屬該指派醫師
const mixedCase = {
  ...emptyCase,
  prescriptions: [
    ...firstAssignment.map((task, index) => (index === 0 ? { ...task, completedCount: 1, status: 'completed' as const } : task)),
    ...courseOnlyCase.prescriptions,
  ],
};
const settledMixed = settleExecutionCycle({ caseItem: mixedCase, now: new Date(2026, 8, 20, 9, 0) });
const settledMixedCycle = settledMixed.executionHistory![settledMixed.executionHistory!.length - 1];
assert.equal(settledMixedCycle.expertPrescriptions.length, firstAssignment.length);
assert.equal(settledMixedCycle.expertPrescriptions.filter((item) => item.completed).length, 1);
assert.equal(settledMixedCycle.courses.length, 3);
assert.equal(settledMixedCycle.assignedBy, '測試醫師');
assert.equal(settledMixed.prescriptions.length, 0);

// 週結算規則：週一至週日，已指派處方與純課程皆適用。
const weeklyBaseline = new Date(2026, 8, 9, 8, 0);
const courseOnlyForWeekly = migrateCaseItem({ ...cloneCase(), prescriptions: [], executionHistory: [] }, weeklyBaseline);
const notDueYet = settleDueCourseOnlyExecutionCycle(courseOnlyForWeekly, new Date(2026, 8, 13, 23, 59));
assert.equal(notDueYet, courseOnlyForWeekly);
const dueSettlement = settleDueCourseOnlyExecutionCycle(courseOnlyForWeekly, new Date(2026, 8, 16, 8, 0));
assert.equal(dueSettlement.executionHistory?.length, 1);
assert.equal(dueSettlement.prescriptions.length, 3);
assert.equal(dueSettlement.prescriptions.every((task) => task.executionKind === 'course' && task.completedCount === 0), true);
assert.equal(dueSettlement.prescriptions[0].startDate, '2026/09/14');
assert.equal(dueSettlement.executionHistory?.[0].endDate, '2026/09/13');

const mixedForWeekly = { ...courseOnlyForWeekly, prescriptions: [...courseOnlyForWeekly.prescriptions, firstAssignment[0]] };
const notSettledDueToPrescription = settleDueCourseOnlyExecutionCycle(mixedForWeekly, new Date(2026, 8, 20, 8, 0));
assert.equal(notSettledDueToPrescription.prescriptions.length, mixedForWeekly.prescriptions.length);
assert.equal(notSettledDueToPrescription.prescriptions.every((task) => task.completedCount === 0), true);
assert.equal(notSettledDueToPrescription.executionHistory?.length, 1);

// migrateCaseItem 載入個案時會自動套用週結算
const migratedAfterAWeek = migrateCaseItem(courseOnlyForWeekly, new Date(2026, 8, 16, 8, 0));
assert.equal(migratedAfterAWeek.executionHistory?.length, 1);
assert.equal(migratedAfterAWeek.prescriptions.filter((task) => task.executionKind === 'course').length, 3);

// 模擬醫師依新問卷指派處方的完整流程：立即結算舊週期 -> 套用新處方 -> 補齊新週期課程
const beforeAssignmentCase = migrateCaseItem({ ...cloneCase(), prescriptions: [], executionHistory: [] }, new Date(2026, 8, 9, 8, 0));
const assignmentNow = new Date(2026, 8, 9, 10, 0);
const settledBeforeAssignment = settleExecutionCycle({ caseItem: beforeAssignmentCase, now: assignmentNow });
const newlyAssigned = reconcileQuestionnairePrescriptions({
  caseItem: settledBeforeAssignment,
  questionnaire,
  selections,
  assignedBy: '測試醫師',
  now: assignmentNow,
});
const afterAssignmentPrescriptions = ensureDefaultCourseTasks({ ...settledBeforeAssignment, prescriptions: newlyAssigned }, assignmentNow);
assert.equal(settledBeforeAssignment.executionHistory?.length, 1);
assert.equal(settledBeforeAssignment.executionHistory![0].courses.length, 3);
assert.equal(settledBeforeAssignment.executionHistory![0].assignedBy, undefined);
assert.equal(afterAssignmentPrescriptions.filter((task) => task.executionKind === 'course').length, 3);
assert.equal(afterAssignmentPrescriptions.filter((task) => task.executionKind !== 'course').length, selections.length);

// ---- 未指派處方課程上限：起算基準 = 首次登入(firstLoginAt) 與 最近一次收到處方時間，取較晚者 ----
// （mock 資料 firstLoginAt 為 2026/7/16 19:20，無任何指派紀錄時 3 個月後的界線為 2026/10/16 19:20）

// 完全沒有首次登入紀錄、也從未收到過處方：視為尚無可用基準，不設上限
const noAnchorCase = { ...cloneCase(), prescriptions: [], executionHistory: [], firstLoginAt: undefined };
assert.equal(hasExceededUnassignedCourseWindow(noAnchorCase, new Date(2035, 0, 1)), false);

const neverAssignedCase = { ...cloneCase(), prescriptions: [], executionHistory: [] };
assert.equal(hasExceededUnassignedCourseWindow(neverAssignedCase, new Date(2026, 9, 16, 19, 0)), false);
assert.equal(hasExceededUnassignedCourseWindow(neverAssignedCase, new Date(2026, 9, 16, 19, 20)), true);

// 收到處方的時間比首次登入晚：基準改用收到處方的時間，且上限只是往後遞延，並非永久解除
const laterAssignedCase = {
  ...neverAssignedCase,
  executionHistory: [{
    id: 'once-assigned',
    startDate: '2026/08/10',
    endDate: '2026/08/16',
    assignedBy: '測試醫師',
    expertPrescriptions: [],
    courses: [],
  }],
};
assert.equal(hasExceededUnassignedCourseWindow(laterAssignedCase, new Date(2026, 10, 9)), false);
assert.equal(hasExceededUnassignedCourseWindow(laterAssignedCase, new Date(2026, 10, 10)), true);

// 多筆指派紀錄時取最近一次
const multipleAssignedCase = {
  ...neverAssignedCase,
  executionHistory: [
    { id: 'a', startDate: '2026/07/20', endDate: '2026/07/26', assignedBy: '測試醫師', expertPrescriptions: [], courses: [] },
    { id: 'b', startDate: '2026/09/01', endDate: '2026/09/07', assignedBy: '測試醫師', expertPrescriptions: [], courses: [] },
  ],
};
assert.equal(hasExceededUnassignedCourseWindow(multipleAssignedCase, new Date(2026, 10, 30)), false);
assert.equal(hasExceededUnassignedCourseWindow(multipleAssignedCase, new Date(2026, 11, 1)), true);

// 第一次載入就已超過上限：不產生任何預設課程任務
const migratedPastCutoff = migrateCaseItem(neverAssignedCase, new Date(2026, 9, 20, 9, 0));
assert.equal(migratedPastCutoff.prescriptions.length, 0);

// 週期進行到一半才跨過上限界線：最後一個課程週期仍會正常結算進歷史紀錄，但不再產生下一週
const idleCaseBeforeCutoff = migrateCaseItem(neverAssignedCase, new Date(2026, 9, 10, 9, 0));
assert.equal(idleCaseBeforeCutoff.prescriptions.filter((task) => task.executionKind === 'course').length, 3);
const idleCaseAfterCutoff = settleDueCourseOnlyExecutionCycle(idleCaseBeforeCutoff, new Date(2026, 9, 20, 9, 0));
assert.equal(idleCaseAfterCutoff.executionHistory?.length, (idleCaseBeforeCutoff.executionHistory?.length ?? 0) + 1);
assert.equal(idleCaseAfterCutoff.prescriptions.length, 0);

// 最近一次現行處方限定：移除後再加入不回溯舊紀錄；跨問卷仍可繼承。
const sixSelections = Array.from({ length: 6 }, (_, index) => ({ ...selections[0], definitionId: `A${index + 1}`, text: `A${index + 1}` }));
const mondayTasks = reconcileQuestionnairePrescriptions({ caseItem: emptyCase, questionnaire, selections: sixSelections, assignedBy: '測試醫師', now: new Date(2026, 8, 14, 9) })
  .map((task) => ({ ...task, completedCount: 1 }));
const thursdayTasks = reconcileQuestionnairePrescriptions({ caseItem: { ...emptyCase, prescriptions: mondayTasks }, questionnaire: { ...questionnaire, id: 'thursday' }, selections: sixSelections.slice(0, 4), assignedBy: '測試醫師', now: new Date(2026, 8, 17, 9) });
assert.equal(thursdayTasks.length, 4);
assert.equal(thursdayTasks.every((task) => task.completedCount === 1 && task.sourceQuestionnaireId === 'thursday'), true);
const sundayTasks = reconcileQuestionnairePrescriptions({ caseItem: { ...emptyCase, prescriptions: thursdayTasks }, questionnaire: { ...questionnaire, id: 'sunday' }, selections: sixSelections, assignedBy: '測試醫師', now: new Date(2026, 8, 20, 9) });
assert.deepEqual(sundayTasks.map((task) => task.completedCount), [1, 1, 1, 1, 0, 0]);
assert.equal(sundayTasks.every((task) => task.endDate === '2026/09/20'), true);
const nextWeekCase = settleDueCourseOnlyExecutionCycle({ ...emptyCase, prescriptions: sundayTasks, executionHistory: [] }, new Date(2026, 8, 21, 0, 1));
assert.equal(nextWeekCase.executionHistory?.[0].endDate, '2026/09/20');
assert.equal(nextWeekCase.prescriptions.length, 6);
assert.equal(nextWeekCase.prescriptions.every((task) => task.completedCount === 0 && task.endDate === '2026/09/27'), true);
assert.equal(settleDueCourseOnlyExecutionCycle(nextWeekCase, new Date(2026, 8, 21, 1)), nextWeekCase);
const nextAssignment = reconcileQuestionnairePrescriptions({ caseItem: nextWeekCase, questionnaire, selections: sixSelections, assignedBy: '測試醫師', now: new Date(2026, 8, 21, 1) });
assert.equal(nextAssignment.every((task) => task.completedCount === 0), true);
console.log('green prescription validation: PASS');
