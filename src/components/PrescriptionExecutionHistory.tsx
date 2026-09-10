import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PrescriptionExecutionCycle } from '../types';
import {
  calculatePrescriptionExecutionCycleSummary,
  groupHistoricalPrescriptions,
  sortPrescriptionExecutionCycles,
} from '../utils/prescriptionExecutionHistory';

interface PrescriptionExecutionHistoryProps {
  cycles: PrescriptionExecutionCycle[];
}

export const PrescriptionExecutionHistory: React.FC<PrescriptionExecutionHistoryProps> = ({ cycles }) => {
  const [expandedCycleIds, setExpandedCycleIds] = useState<Set<string>>(() => new Set());
  const sortedCycles = useMemo(() => sortPrescriptionExecutionCycles(cycles), [cycles]);

  if (sortedCycles.length === 0) return null;

  const toggleCycle = (cycleId: string) => {
    setExpandedCycleIds((current) => {
      const next = new Set(current);
      if (next.has(cycleId)) next.delete(cycleId);
      else next.add(cycleId);
      return next;
    });
  };

  return (
    <div className="mt-6 border-t border-zinc-200 pt-5">
      <h3 className="mb-3 text-sm font-black text-zinc-900">過往執行週期</h3>
      <div className="space-y-3">
        {sortedCycles.map((cycle) => {
          const summary = calculatePrescriptionExecutionCycleSummary(cycle);
          const prescriptionGroups = groupHistoricalPrescriptions(cycle.expertPrescriptions ?? []);
          const courses = Array.isArray(cycle.courses) ? cycle.courses : [];
          const expanded = expandedCycleIds.has(cycle.id);
          const untitledCompletedCourses = courses.filter((course) => course.completed && !course.title?.trim()).length;
          const untitledIncompleteCourses = courses.filter((course) => !course.completed && !course.title?.trim()).length;

          return (
            <article
              key={cycle.id}
              data-execution-cycle-id={cycle.id}
              data-execution-cycle-expanded={String(expanded)}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
            >
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={`execution-cycle-detail-${cycle.id}`}
                onClick={() => toggleCycle(cycle.id)}
                className="flex w-full items-start justify-between gap-4 p-4 text-left transition-colors hover:bg-orange-50/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-zinc-900">{cycle.startDate} – {cycle.endDate}</p>
                  <p className="mt-2 text-sm font-bold text-zinc-800">整體達成率 {summary.overallRate}%</p>
                  <p className="mt-1 text-xs text-zinc-500">已完成 {summary.completedTotal} 項｜未完成 {summary.incompleteTotal} 項</p>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs font-bold text-zinc-700">
                    <span>專家處方 {summary.expertCompleted} / {summary.expertTotal}</span>
                    <span>課程 {summary.courseCompleted} / {summary.courseTotal}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {cycle.assignedBy && (
                    <span className="text-xs font-bold text-emerald-600">由{cycle.assignedBy}指派</span>
                  )}
                  {expanded
                    ? <ChevronUp className="h-5 w-5 shrink-0 text-zinc-400" />
                    : <ChevronDown className="h-5 w-5 shrink-0 text-zinc-400" />}
                </div>
              </button>

              {expanded && (
                <div id={`execution-cycle-detail-${cycle.id}`} className="border-t border-zinc-100 px-4 pb-5 pt-4">
                  {summary.expertTotal > 0 && (
                    <section>
                      <h4 className="text-sm font-black text-zinc-900">專家處方 {summary.expertCompleted} / {summary.expertTotal}</h4>
                      <div className="mt-3 space-y-4">
                        {prescriptionGroups.map((group) => (
                          <div key={group.label}>
                            <h5 className="text-xs font-black text-zinc-600">{group.label}</h5>
                            <div className="mt-2 space-y-1.5">
                              {group.items.map((item) => (
                                <p key={item.id} className="flex min-w-0 items-start gap-2 text-xs text-zinc-700">
                                  <span className={`mt-px shrink-0 font-black ${item.completed ? 'text-emerald-600' : 'text-zinc-500'}`} aria-hidden="true">
                                    {item.completed ? '✓' : '×'}
                                  </span>
                                  <span className="min-w-0 break-words">{item.title}</span>
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {summary.courseTotal > 0 && (
                    <section className={summary.expertTotal > 0 ? 'mt-5 border-t border-zinc-100 pt-4' : ''}>
                      <h4 className="text-sm font-black text-zinc-900">課程 {summary.courseCompleted} / {summary.courseTotal}</h4>
                      <div className="mt-3 space-y-1.5">
                        {courses.filter((course) => course.title?.trim()).map((course) => (
                          <p key={course.id} className="flex min-w-0 items-start gap-2 text-xs text-zinc-700">
                            <span className={`mt-px shrink-0 font-black ${course.completed ? 'text-emerald-600' : 'text-zinc-500'}`} aria-hidden="true">
                              {course.completed ? '✓' : '×'}
                            </span>
                            <span className="min-w-0 break-words">{course.title}</span>
                          </p>
                        ))}
                        {untitledCompletedCourses > 0 && (
                          <p className="text-xs text-zinc-600">已完成觀看影片 {untitledCompletedCourses} 部</p>
                        )}
                        {untitledIncompleteCourses > 0 && (
                          <p className="text-xs text-zinc-600">未達成觀看影片 {untitledIncompleteCourses} 部</p>
                        )}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};
