import { CaseItem } from '../types';

export const INITIAL_CASES: CaseItem[] = [
  {
    id: 'case-chen-xiaoming',
    code: 'XM883901',
    name: '陳小明',
    nickname: '小明',
    idNumber: 'A123****88',
    gender: '男',
    birthday: '1970-08-14',
    age: 56,
    height: 175,
    weight: 70,
    bloodType: 'O型',
    trackingDate: '2026/8/20 10:30',
    enrolledDate: '2026/7/15 09:00',
    program: '慢病管理計畫',
    notes: '定期追蹤血壓與環境空污',
    lifestyleSurvey: {
      submittedAt: '2026/09/02',
      interests: ['運動習慣', '飲食習慣'],
    },
    questionnaireHistory: [
      {
        id: 'survey-lifestyle-20260902',
        title: '生活型態問卷',
        submittedAt: '2026/09/02',
        status: 'completed',
        interests: ['運動習慣', '飲食習慣'],
      },
    ],
    
    bloodPressure: { systolic: 128, diastolic: 82, heartRate: 72, status: 'good' },
    airPollution: { aqi: 42, status: 'good' },
    
    activity: { steps: undefined, status: 'none' },
    bodyMetrics: { weightKg: undefined, waistCm: undefined, bmi: undefined, status: 'none' },
    bloodSugar: { value: undefined, status: 'none' },
    medicalRecord: { count: 0, status: 'none' },
    followUp: { date: undefined, status: 'none' },
    weather: { summary: '-', temp: undefined, status: 'none' },
    
    prescriptionStatus: {
      hasPrescription: true,
      activeCount: 1,
      complianceRate: 80,
      status: 'good',
      lastAssignedDate: '2026/08/17',
    },
    userNotes: '',
    education: { completed: false },
    chronicHypertension: '有',
    migraine: '無',
    parkinsons: '無',
    stroke: '無',
    surveyStatus: '已完成',
    labTestStatus: '-',
    medicationStatus: '規律服藥',
    riskPrediction: '低風險',
    dietStatus: '正常',
    prescriptions: [
      {
        id: 'p-1',
        category: '運動',
        title: '每日超慢跑 20 分鐘',
        description: '保持心率 110-120 bpm',
        frequency: '每日',
        durationMinutes: 20,
        targetCount: 7,
        completedCount: 5,
        startDate: '2026/08/17',
        endDate: '2026/08/24',
        status: 'active',
        courseType: 'video',
        assignedBy: '張醫師',
        assignedAt: '2026/08/17 09:30',
      }
    ],
    executionLogs: []
  }
];

export const PRESCRIPTION_CATEGORIES = [
  '身體活動',
  '運動',
  '藝術活動',
  '社交互動',
  '個人發展',
  '自我管理教育',
  '自我照護管理',
  '社會支持',
  '文化活動',
  '宗教活動'
] as const;

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; barColor: string }> = {
  身體活動: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', barColor: '#f08327' },
  運動: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', barColor: '#f08327' },
  藝術活動: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300', barColor: '#f43f5e' },
  社交互動: { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-300', barColor: '#0ea5e9' },
  個人發展: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300', barColor: '#6366f1' },
  自我管理教育: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300', barColor: '#14b8a6' },
  自我照護管理: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', barColor: '#10b981' },
  社會支持: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', barColor: '#a855f7' },
  文化活動: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', barColor: '#ea580c' },
  宗教活動: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300', barColor: '#06b6d4' },
};
