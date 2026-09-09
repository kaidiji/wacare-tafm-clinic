export type TaskCategory = 
  | '身體活動'
  | '運動'
  | '藝術活動'
  | '社交互動'
  | '個人發展'
  | '自我管理教育'
  | '自我照護管理'
  | '社會支持'
  | '文化活動'
  | '宗教活動'
  | (string & {});

export type StatusLevel = 'good' | 'normal' | 'attention' | 'concern' | 'none';

export type LifestyleFocus = '運動習慣' | '飲食習慣' | '睡眠品質' | '壓力管理' | '戒菸／戒酒／戒檳榔' | '增加人際互動';

export interface QuestionnaireRecord {
  id: string;
  title: string;
  submittedAt: string;
  status: 'completed';
  interests: LifestyleFocus[];
}

export interface PrescriptionTask {
  id: string;
  category: TaskCategory;
  title: string;
  description: string;
  frequency: string; // e.g. '每週 3 次' | '每日 1 次'
  durationMinutes: number;
  targetCount: number;
  completedCount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'pending' | 'paused';
  courseType: 'live' | 'video' | 'custom';
  recommendedUrl?: string;
  doctorNotes?: string;
  assignedBy: string;
  assignedAt: string;
  rewardPoints?: number;
  sourceQuestionnaireId?: string;
  prescriptionLevel?: '基本處方' | '加強處方';
  prescriptionFocus?: string;
}

export interface ExecutionLog {
  id: string;
  taskId: string;
  taskTitle: string;
  category: TaskCategory;
  date: string;
  durationMinutes: number;
  type: 'live' | 'video' | 'custom';
  userNote?: string;
  doctorFeedback?: string;
}

export interface CaseItem {
  id: string;
  code: string; // e.g. EWXZJDJK
  name: string;
  nickname: string;
  avatarUrl?: string;
  idNumber?: string;
  gender: '男' | '女' | '尚無資料';
  birthday: string;
  age: number | string;
  height: number | string;
  weight: number | string;
  bloodType: string;
  trackingDate: string;
  enrolledDate: string;
  program: string;
  notes: string;
  lifestyleSurvey?: {
    submittedAt: string;
    interests: LifestyleFocus[];
  };
  questionnaireHistory?: QuestionnaireRecord[];
  
  // Table Metrics & Indicators
  bloodPressure: {
    systolic?: number;
    diastolic?: number;
    heartRate?: number;
    status: StatusLevel;
  };
  activity: {
    steps?: number;
    status: StatusLevel;
    lastUpdated?: string;
  };
  prescriptionStatus: {
    hasPrescription: boolean;
    activeCount: number;
    complianceRate: number; // e.g. 85%
    status: StatusLevel; // Green light indicator!
    lastAssignedDate?: string;
  };
  bodyMetrics: {
    weightKg?: number;
    waistCm?: number;
    bmi?: number;
    status: StatusLevel;
  };
  airPollution: {
    aqi?: number;
    status: StatusLevel;
  };
  medicalRecord: {
    count?: number;
    lastDate?: string;
    status: StatusLevel;
  };
  userNotes: string;
  followUp: {
    date?: string;
    status: StatusLevel;
  };
  weather: {
    summary?: string;
    temp?: number;
    status: StatusLevel;
  };
  bloodSugar: {
    value?: number;
    status: StatusLevel;
  };
  education: {
    completed: boolean;
    title?: string;
  };
  chronicHypertension: string;
  migraine: string;
  parkinsons: string;
  stroke: string;
  surveyStatus: string;
  labTestStatus: string;
  medicationStatus: string;
  riskPrediction: string;
  dietStatus: string;

  // Detailed Prescriptions
  prescriptions: PrescriptionTask[];
  executionLogs: ExecutionLog[];
}
