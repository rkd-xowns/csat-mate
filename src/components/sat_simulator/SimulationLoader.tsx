// src/components/sat_simulator/SimulationLoader.tsx

import React from 'react';

interface SimulationLoaderProps {
  mode: 'loading' | 'realtime-waiting' | 'tests-finished';
  isStartEnabled?: boolean;
  onStart?: () => void;
  waitingMessage?: string;
  nextTestName?: string;
  onAbort: () => void;
}

const SimulationLoader: React.FC<SimulationLoaderProps> = ({ 
  mode,
  isStartEnabled = false,
  onStart,
  waitingMessage = '',
  nextTestName,
  onAbort
}) => {
  // 모드별 콘텐츠 설정
  const getContent = () => {
    switch (mode) {
      case 'loading':
        return {
          icon: '⚡',
          title: '시뮬레이션 로딩 중...',
          message: '잠시 후 시작 버튼이 활성화됩니다.',
          showButton: true,
          buttonText: isStartEnabled ? '시뮬레이션 시작' : '준비 중',
          buttonAction: onStart,
          buttonDisabled: !isStartEnabled,
          buttonClass: 'primary-button disabled:opacity-50 disabled:cursor-not-allowed'
        };
      
      case 'realtime-waiting':
        return {
          icon: '⏰',
          title: '실제 수능 시간 모드',
          message: waitingMessage,
          showButton: false, // Abort button is handled separately
          showAutoStart: true
        };
      
      case 'tests-finished':
        return {
          icon: '✅',
          title: '수능 시험 완료',
          message: '오늘의 모든 수능 시험이 완료되었습니다.',
          subMessage: '수고하셨습니다!',
          showButton: false, // Abort button is handled separately
        };
      
      default:
        return {};
    }
  };

  const content = getContent();

  return (
    <div className="page-layout login-container justify-center">
      <div className="login-content-area max-w-lg flex flex-col items-center gap-6 text-center">
        {/* 아이콘 */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-6xl mb-4">
            {content.icon}
          </div>
          <h2 className="title-text">
            {content.title}
          </h2>
        </div>
        
        {/* 메시지 영역 */}
        <div className="flex flex-col items-center gap-4">
          <p className="description-text text-2xl font-bold text-blue-600 dark:text-blue-400">
            {content.message}
          </p>
          
          {content.subMessage && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>{content.subMessage}</p>
            </div>
          )}
          
          {/* 다음 시험 정보 (실시간 모드용) */}
          {nextTestName && mode === 'realtime-waiting' && (
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">다음 시험</p>
              <p className="font-semibold text-blue-800 dark:text-blue-200">{nextTestName}</p>
            </div>
          )}
          
          {/* 자동 시작 안내 (실시간 모드용) */}
          {content.showAutoStart && (
            <div className="flex flex-col items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>시간이 되면 자동으로 시작됩니다</span>
              </div>
              <p className="text-xs">화면을 그대로 두세요</p>
            </div>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="flex flex-col gap-2 w-full mt-4">
          {content.showButton && (
            <button 
              onClick={content.buttonAction} 
              disabled={content.buttonDisabled}
              className={content.buttonClass}
            >
              {content.buttonText}
            </button>
          )}
          
          {/* 중단/홈으로 버튼 */}
          <button 
            onClick={onAbort} 
            className="secondary-button"
          >
            {mode === 'tests-finished' ? '홈으로 돌아가기' : '시뮬레이션 중단'}
          </button>
          
          {/* 알림 안내 (실시간 모드용) */}
          {mode === 'realtime-waiting' && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              브라우저를 닫아도 알림으로 시험 시작을 알려드립니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulationLoader;