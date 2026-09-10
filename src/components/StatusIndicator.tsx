import React from 'react';
import { StatusLevel } from '../types';

interface StatusIndicatorProps {
  level: StatusLevel;
  className?: string;
  size?: number;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ level, className = '', size = 22 }) => {
  switch (level) {
    case 'good':
      // 良好 - 綠色笑臉
      return (
        <span title="狀態良好" className={`inline-flex items-center justify-center ${className}`}>
          <svg width={size} height={size} viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7.5" cy="8" r="7" fill="#8DB322" />
            <path d="M7.5 5.5C7.5 5.5 5.9 8.16 7.5 8.16C9.1 8.16 7.5 5.5 7.5 5.5Z" fill="white" />
            <circle cx="5.5" cy="5.8" r="0.7" fill="white" />
            <circle cx="9.5" cy="5.8" r="0.7" fill="white" />
            <path d="M5 9.5C5.5 10.1 6.9 10.4 7.5 10.4C8.1 10.4 9.4 10.1 10 9.5" stroke="white" strokeWidth="0.9" strokeLinecap="round" />
          </svg>
        </span>
      );
    case 'normal':
      // 正常 - 黃綠色平靜臉
      return (
        <span title="狀態正常" className={`inline-flex items-center justify-center ${className}`}>
          <svg width={size} height={size} viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7.5" cy="8" r="7" fill="#FBC400" />
            <path d="M7.5 5.5C7.5 5.5 6.375 8 7.5 8C8.625 8 7.5 5.5 7.5 5.5Z" fill="white" />
            <circle cx="5.5" cy="6" r="0.6" fill="white" />
            <circle cx="9.5" cy="6" r="0.6" fill="white" />
            <line x1="5" y1="10" x2="10" y2="10" stroke="white" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </span>
      );
    case 'attention':
      // 注意 - 橘色微皺臉
      return (
        <span title="需注意" className={`inline-flex items-center justify-center ${className}`}>
          <svg width={size} height={size} viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7.5" cy="8" r="7" fill="#F08327" />
            <path d="M7.5 5.5C7.5 5.5 5.9 8.16 7.5 8.16C9.1 8.16 7.5 5.5 7.5 5.5Z" fill="white" />
            <circle cx="5.5" cy="5.8" r="0.6" fill="white" />
            <circle cx="9.5" cy="5.8" r="0.6" fill="white" />
            <path d="M10 10.4C9.5 9.8 8.1 9.5 7.5 9.5C6.9 9.5 5.6 9.8 5 10.4" stroke="white" strokeWidth="0.9" strokeLinecap="round" />
          </svg>
        </span>
      );
    case 'concern':
      // 關注 - 紅色難過臉
      return (
        <span title="高度關注" className={`inline-flex items-center justify-center ${className}`}>
          <svg width={size} height={size} viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7.5" cy="8" r="7" fill="#E54711" />
            <path d="M7.5 5.5C7.5 5.5 6.375 8 7.5 8C8.625 8 7.5 5.5 7.5 5.5Z" fill="white" />
            <circle cx="5.5" cy="6" r="0.6" fill="white" />
            <circle cx="9.5" cy="6" r="0.6" fill="white" />
            <path d="M5.5 10.5C5.8 9.6 6.7 9 7.75 9C8.8 9 9.7 9.6 10 10.5" stroke="white" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </span>
      );
    case 'none':
    default:
      // 無狀態 - 灰色中性臉
      return (
        <span title="無狀態/未設定" className={`inline-flex items-center justify-center ${className}`}>
          <svg width={size} height={size} viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7.5" cy="8" r="6.5" stroke="#898989" strokeWidth="1.2" fill="none" />
            <circle cx="5.5" cy="6.2" r="0.6" fill="#898989" />
            <circle cx="9.5" cy="6.2" r="0.6" fill="#898989" />
            <path d="M5.5 9.2C5.8 9.8 6.5 10.3 7.5 10.3C8.5 10.3 9.2 9.8 9.5 9.2" stroke="#898989" strokeWidth="0.8" strokeLinecap="round" fill="none" />
          </svg>
        </span>
      );
  }
};

interface GreenPrescriptionLightProps {
  hasQuestionnaire: boolean;
  hasPrescription: boolean;
  activeCount: number;
  complianceRate: number;
  status?: StatusLevel;
  onClick: (e: React.MouseEvent) => void;
}

export const GreenPrescriptionLight: React.FC<GreenPrescriptionLightProps> = ({
  hasQuestionnaire,
  hasPrescription,
  activeCount,
  complianceRate,
  status = 'good',
  onClick,
}) => {
  // 狀態一：尚未填寫生活型態問卷
  if (!hasQuestionnaire) {
    return (
      <div
        id="green-prescription-indicator-btn"
        data-green-prescription-state="no-questionnaire"
        onClick={onClick}
        title="點擊進入數位綠色處方設定與任務指派頁面"
        className="flex flex-col items-center justify-center cursor-pointer group"
      >
        <span className="text-[10px] text-zinc-400 font-medium mb-1 group-hover:text-[#f08327] transition-colors">
          綠色處方
        </span>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500 group-hover:bg-zinc-200 transition-colors">
          未填問卷
        </span>
      </div>
    );
  }

  // 狀態二：已填寫問卷，等待醫師指派任務
  if (!hasPrescription) {
    return (
      <div
        id="green-prescription-indicator-btn"
        data-green-prescription-state="pending-assignment"
        onClick={onClick}
        title="點擊進入數位綠色處方設定與任務指派頁面"
        className="flex flex-col items-center justify-center cursor-pointer group"
      >
        <span className="text-[10px] text-zinc-400 font-medium mb-1 group-hover:text-[#f08327] transition-colors">
          綠色處方
        </span>
        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-[#f08327] group-hover:bg-[#f08327] group-hover:text-white transition-colors">
          待指派任務
        </span>
      </div>
    );
  }

  // 狀態三：使用者正在執行處方（維持現況）
  return (
    <div
      id="green-prescription-indicator-btn"
      data-green-prescription-state="in-progress"
      onClick={onClick}
      title="點擊進入數位綠色處方設定與任務指派頁面"
      className="flex flex-col items-center justify-center cursor-pointer group"
    >
      <StatusIndicator level={status} size={22} />
      <span className="text-[10px] text-zinc-400 font-medium mt-0.5 group-hover:text-[#f08327] transition-colors">
        綠色處方
      </span>
      <span className="text-xs font-bold text-zinc-800 group-hover:text-[#f08327] transition-colors">
        {`${activeCount} 項任務 (${complianceRate}%)`}
      </span>
    </div>
  );
};
