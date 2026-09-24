import React, { useMemo } from 'react';
import { Check } from 'lucide-react';
import { PrescriptionTask } from '../types';
import {
  calculateCurrentExecutionTaskProgress,
  calculateCurrentGreenPrescriptionSummary,
  getCurrentPeriodRangeLabel,
  groupCurrentPrescriptionTasks,
} from '../utils/currentGreenPrescriptionExecution';

interface CurrentPrescriptionExecutionProps {
  tasks: PrescriptionTask[];
}

const TaskRow: React.FC<{ task: Pick<PrescriptionTask, 'id' | 'title' | 'targetCount' | 'completedCount'> }> = ({ task }) => {
  const progress = calculateCurrentExecutionTaskProgress(task);
  const completed = progress.state === 'completed';

  return (
    <div className="flex min-w-0 items-start gap-3 border-t border-zinc-100 py-3 first:border-t-0" data-execution-task-state={progress.state}>
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${completed ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-zinc-300 bg-white'}`}
        aria-hidden="true"
      >
        {completed && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1 break-words text-sm text-zinc-800">{task.title}</span>
      <span className={`shrink-0 text-xs font-bold ${completed ? 'text-emerald-600' : progress.state === 'in-progress' ? 'text-[#f08327]' : 'text-zinc-400'}`}>
        {completed ? '已達成' : progress.state === 'in-progress' ? `進行中 ${progress.completedCount} / ${progress.targetCount}` : '未達成'}
      </span>
    </div>
  );
};

export const CurrentPrescriptionExecution: React.FC<CurrentPrescriptionExecutionProps> = ({ tasks }) => {
  const prescriptions = useMemo(() => tasks.filter((task) => task.executionKind !== 'course'), [tasks]);
  const courses = useMemo(() => tasks.filter((task) => task.executionKind === 'course'), [tasks]);
  const summary = useMemo(
    () => calculateCurrentGreenPrescriptionSummary({ tasks }),
    [tasks],
  );
  const prescriptionGroups = useMemo(() => groupCurrentPrescriptionTasks(prescriptions), [prescriptions]);
  const periodRange = useMemo(() => getCurrentPeriodRangeLabel(tasks), [tasks]);

  return (
    <div data-current-green-summary={`${summary.completedTotal}/${summary.totalCount}`}>
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-black text-zinc-900">本期綠色處方</h3>
        {periodRange && <p className="mt-1 text-sm font-medium text-zinc-500" aria-label="本期任務週期">{periodRange}</p>}
        <div className="mt-3 flex items-end gap-3">
          <span className="text-3xl font-black tracking-tight text-zinc-900">{summary.completedTotal} / {summary.totalCount}</span>
          <span className="pb-1 text-sm font-bold text-zinc-500">{summary.overallRate}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full rounded-full bg-[#f08327]" style={{ width: `${summary.overallRate}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-xs font-bold text-zinc-600">
          <span>生活型態處方 {summary.prescriptionCompleted} / {summary.prescriptionTotal}</span>
          <span>課程 {summary.courseCompleted} / {summary.courseTotal}</span>
        </div>
      </div>

      <div className="mt-4 space-y-4" aria-label="任務執行清單">
        {prescriptions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center text-sm text-zinc-500">尚未指派處方</p>
        ) : (
          prescriptionGroups.map((group) => {
            const completedCount = group.tasks.filter(
              (task) => calculateCurrentExecutionTaskProgress(task).state === 'completed',
            ).length;
            return (
              <section key={group.label} className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-3 pb-1">
                  <h4 className="text-sm font-black text-zinc-900">{group.label}處方</h4>
                  <span className="shrink-0 text-xs font-bold text-zinc-500">{completedCount} / {group.tasks.length}</span>
                </div>
                <div>{group.tasks.map((task) => <TaskRow key={task.id} task={task} />)}</div>
              </section>
            );
          })
        )}

        {courses.length > 0 && (
          <section className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-3 pb-1">
              <h4 className="text-sm font-black text-zinc-900">課程</h4>
              <span className="shrink-0 text-xs font-bold text-zinc-500">{summary.courseCompleted} / {summary.courseTotal}</span>
            </div>
            <div>{courses.map((course) => <TaskRow key={course.id} task={course} />)}</div>
          </section>
        )}
      </div>
    </div>
  );
};
