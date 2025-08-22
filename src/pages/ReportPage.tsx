import React, { useRef, useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import type { FinishData, Lap } from '../types/simulator';

// --- Helper Functions ---

// 수능 D-Day 계산
const getCsatDday = () => {
    // 2026학년도 수능일 (2025년 11월 13일) - 필요시 수정하세요.
    const csatDate = new Date('2025-11-13T00:00:00'); 
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = csatDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// 초를 MM:SS 형식으로 변환
const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
};

// --- Type Definitions ---

// ReportPage가 받을 Props 타입 정의
interface ReportPageProps {
  result: FinishData | null;
}

// 편집 가능한 랩 데이터의 타입 정의
interface EditableLap extends Lap {
  description: string;
}

// --- Component ---

const ReportPage: React.FC<ReportPageProps> = ({ result }) => {
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [today, setToday] = useState('');
  const [dDay, setDDay] = useState(0);

  // 편집 가능한 상태 관리
  const [reportTitle, setReportTitle] = useState('');
  const [lapDetails, setLapDetails] = useState<{ [subjectName: string]: EditableLap[] }>({});
  const [showVirtualTime, setShowVirtualTime] = useState(true);

  useEffect(() => {
    setToday(new Date().toLocaleDateString('ko-KR'));
    setDDay(getCsatDday());

    // result 데이터가 있을 때, 편집 가능한 내부 상태(lapDetails)를 초기화합니다.
    if (result?.data) {
      const initialDetails: { [subjectName: string]: EditableLap[] } = {};
      Object.keys(result.data).forEach(subjectName => {
        initialDetails[subjectName] = result.data[subjectName].map(lap => ({
          ...lap,
          description: '', // 활동 내용을 위한 빈 문자열 추가
        }));
      });
      setLapDetails(initialDetails);
    }
  }, [result]);

  // 활동 내용 수정 핸들러
  const handleDescriptionChange = (subjectName: string, lapIndex: number, newDescription: string) => {
    setLapDetails(prev => ({
      ...prev,
      [subjectName]: prev[subjectName].map((lap, index) => 
        index === lapIndex ? { ...lap, description: newDescription } : lap
      )
    }));
  };

  // PDF 저장 핸들러
  const handleExportPDF = () => {
    const element = reportRef.current;
    if (!element) return;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `수능메이트_결과보고서_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };
  
  // result 데이터가 없으면 메인 페이지로 리디렉션
  if (!result) {
    return <Navigate to="/main" replace />;
  }
  
  const { data: lapData, status } = result;
  const subjects = Object.keys(lapData || {}).join(', ');

  return (
    <div className="p-4 sm:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
      {/* A4 사이즈 시트 */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8" ref={reportRef}>
        <h1 className="text-4xl font-bold text-center mb-2">결과 보고서</h1>
        {status === 'aborted' && (
            <h3 className="text-center text-red-500 mt-2 mb-6 font-semibold">-- 시뮬레이션 중단됨 --</h3>
        )}
        
        {/* 메타 정보 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 border-y-2 py-4">
          <div className="flex justify-between"><strong>수능 D-DAY</strong><span>D-{dDay}</span></div>
          <div className="flex justify-between"><strong>날짜</strong><span>{today}</span></div>
          <div className="flex justify-between items-center">
            <strong className="flex-shrink-0 mr-2">제목</strong>
            <input 
              type="text" 
              className="w-full bg-transparent text-right p-1 border-b-2 border-gray-300 focus:border-blue-500 outline-none"
              value={reportTitle} 
              onChange={e => setReportTitle(e.target.value)} 
              placeholder="제목 입력..."
            />
          </div>
        </div>

        <div className="mb-8 p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <strong>실시 항목:</strong> {subjects || '없음'}
        </div>
        
        {/* 과목별 랩 기록 */}
        {Object.entries(lapDetails).map(([subjectName, laps]) => (
            <div key={subjectName} className="mb-8">
                <h3 className="text-2xl font-semibold mb-3 border-b-2 pb-2">{subjectName}</h3>
                <div className="text-sm">
                    <div className="flex font-bold bg-gray-100 dark:bg-gray-700 p-2 rounded-t-md">
                        <span className="flex-1">활동 내용 (클릭하여 입력)</span>
                        <span className="w-28 text-center">소요 시간</span>
                        {showVirtualTime && <span className="w-28 text-center">수능 시간</span>}
                    </div>
                    {laps.map((lapInfo, index) => (
                        <div key={index} className="flex items-center border-b p-2">
                            <input 
                              type="text"
                              value={lapInfo.description}
                              onChange={e => handleDescriptionChange(subjectName, index, e.target.value)}
                              placeholder="예: 비문학 1지문, 킬러 2문제 풀이"
                              className="flex-1 bg-transparent outline-none focus:bg-yellow-100 dark:focus:bg-gray-600 rounded px-1"
                            />
                            <span className="w-28 text-center font-mono">{formatTime(lapInfo.lap)}</span>
                            {showVirtualTime && <span className="w-28 text-center font-mono">{lapInfo.time}</span>}
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>

      {/* 컨트롤 패널 */}
      <div className="max-w-4xl mx-auto mt-6 p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
            <input id="showTime" type="checkbox" checked={showVirtualTime} onChange={() => setShowVirtualTime(p => !p)} />
            <label htmlFor="showTime">실제 수능 시간 표시</label>
        </div>
        <div className="flex gap-4">
            <button onClick={handleExportPDF} className="primary-button">PDF로 저장</button>
            <Link to="/main" className="secondary-button">메인으로</Link>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;