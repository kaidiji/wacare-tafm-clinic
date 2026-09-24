import { LifestyleFocus, TaskCategory } from '../types';

export interface AdvancedPrescriptionSection {
  title: string;
  options: string[];
}

export interface GreenPrescriptionGroup {
  focus: string;
  surveyFocus: LifestyleFocus;
  category: TaskCategory;
  basic: string[];
  advanced: AdvancedPrescriptionSection[];
}

export const GREEN_PRESCRIPTION_GROUPS: GreenPrescriptionGroup[] = [
  {
    focus: '飲食',
    surveyFocus: '飲食習慣',
    category: '自我管理教育',
    basic: ['每日攝取至少 3 份蔬菜、2 份水果', '減少高油、高鹽食物', '減少精緻澱粉及含糖飲料', '減少紅肉及加工食品攝取'],
    advanced: [{ title: '個別化加強處方', options: ['以植物性為主，採均衡、多樣化飲食', '適量攝取植物性蛋白質、堅果及優質植物油', '減少外食頻率', '減少宵夜及不必要點心', '體重管理飲食調整', '轉介營養師諮詢', '其它'] }],
  },
  {
    focus: '身體活動',
    surveyFocus: '運動習慣',
    category: '身體活動',
    basic: ['依個人體能及健康狀況逐步增加活動量'],
    advanced: [
      { title: '個別化加強處方', options: ['建議每週運動150分鐘'] },
      { title: '推薦運動', options: ['有氧運動（如快走、慢跑、游泳、球類運動）', '重量訓練', '伸展運動（如瑜珈、皮拉提斯）', '氣功、太極', '其他'] },
      { title: '運動頻率', options: ['每週 1~2 天', '每週 3~4 天', '每週 5~6 天', '每天'] },
      { title: '每次運動時間', options: ['10-20分鐘', '20-30分鐘', '30-60分鐘'] },
    ],
  },
  {
    focus: '睡眠',
    surveyFocus: '睡眠品質',
    category: '自我照護管理',
    basic: ['建立規律作息及固定睡眠時間', '維持適當睡眠時數', '建立良好睡眠環境', '睡前進行放鬆活動（伸展、冥想、閱讀等）'],
    advanced: [{ title: '個別化加強處方', options: ['睡前減少使用 3C 產品', '避免睡前攝取咖啡因', '轉介睡眠／減重專業門診', '其他'] }],
  },
  {
    focus: '壓力管理',
    surveyFocus: '壓力管理',
    category: '個人發展',
    basic: ['每週安排個人放鬆時間', '練習適合自己的壓力調適方法', '建立規律的休息與放鬆習慣'],
    advanced: [{ title: '個別化加強處方', options: ['腹式呼吸訓練', '正念／冥想練習', '肌肉放鬆法', '參與紓壓或壓力管理課程', '心理諮商或相關專業轉介', '其他'] }],
  },
  {
    focus: '正向社會連結',
    surveyFocus: '增加人際互動',
    category: '社交互動',
    basic: ['維持與家人、朋友或他人的正向互動', '每週至少安排一次社交、社區或興趣活動', '建立適合自己的社會支持網絡'],
    advanced: [{ title: '個別化加強處方', options: ['參與社區運動團體', '參與社區關懷據點活動', '參與興趣或學習團體', '參與志工服務', '參與藝文活動', '其他'] }],
  },
  {
    focus: '避免危害物質使用',
    surveyFocus: '戒菸 / 戒酒 / 戒檳榔',
    category: '自我照護管理',
    basic: ['避免或減少菸草、過量酒精及檳榔等危害健康物質', '減少環境毒素暴露，如空氣污染及室內污染', '依個人使用情形設定減量或戒除目標'],
    advanced: [{ title: '個別化加強處方', options: ['訂定戒菸日期或減菸目標', '鼓勵戒菸並轉介戒菸服務', '轉介戒酒資源', '戒除檳榔', '提供成癮治療或相關專業轉介', '減少空污、二手菸及室內污染暴露', '其他'] }],
  },
];

export function normalizeSurveyFocus(rawValue: string): LifestyleFocus | null {
  const value = rawValue.trim().replace(/\s+/g, '').replaceAll('/', '／');
  if (value.includes('戒菸') || value.includes('戒酒') || value.includes('戒檳榔') || value.includes('危害物質')) return '戒菸 / 戒酒 / 戒檳榔';
  if (value.includes('人際') || value.includes('社交') || value.includes('社會連結') || value.includes('正向互動')) return '增加人際互動';
  if (value.includes('運動') || value.includes('身體活動')) return '運動習慣';
  if (value.includes('飲食')) return '飲食習慣';
  if (value.includes('睡眠')) return '睡眠品質';
  if (value.includes('壓力')) return '壓力管理';
  return null;
}

export function getPrescriptionGroupsForInterests(interests: string[]): GreenPrescriptionGroup[] {
  const normalized = new Set(interests.map(normalizeSurveyFocus).filter((value): value is LifestyleFocus => value !== null));
  return GREEN_PRESCRIPTION_GROUPS.filter((group) => normalized.has(group.surveyFocus));
}
