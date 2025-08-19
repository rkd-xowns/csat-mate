// src/pages/csat_simulator_setting.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { EXAM_SUBJECTS_DATA } from '../data/schedule';
import type { SimulatorSettings, SelectedSubjects } from '../types/simulator';

interface SettingsPageProps {
  onStart: (settings: SimulatorSettings) => void;
}

const EXAM_SUBJECT_KEYS: (keyof SelectedSubjects)[] = ['korean', 'math', 'english', 'history', 'inquiry1', 'inquiry2'];

const SettingsPage: React.FC<SettingsPageProps> = ({ onStart }) => {
  const [startMode, setStartMode] = useState<'immediate' | 'real-time'>('immediate');
  // ## 시간 모드 선택 상태 (기본값: 단축 테스트) ##
  const [scheduleMode, setScheduleMode] = useState<'full' | 'test'>('test'); 
  const [selectedSubjects, setSelectedSubjects] = useState<SelectedSubjects>({
    korean: true, math: true, english: true, history: true, inquiry1: true, inquiry2: false,
  });
  const [includeBreaks, setIncludeBreaks] = useState(true);
  const [includeBells, setIncludeBells] = useState(true);
  const [listeningFile, setListeningFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');

  const handleSubjectToggle = (subjectKey: keyof SelectedSubjects) => {
    setSelectedSubjects(prev => ({ ...prev, [subjectKey]: !prev[subjectKey] }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      if(listeningFile) URL.revokeObjectURL(listeningFile);
      setListeningFile(URL.createObjectURL(files[0]));
      setFileName(files[0].name);
    } else {
      setListeningFile(null);
      setFileName('');
    }
  };

  const handleStartClick = () => {
    // onStart에 scheduleMode 추가
    onStart({ startMode, scheduleMode, selectedSubjects, includeBreaks, includeBells, listeningFile });
  };

  const selectedSubjectNames = (Object.keys(EXAM_SUBJECTS_DATA) as (keyof SelectedSubjects)[])
    .filter(key => selectedSubjects[key])
    .map(key => EXAM_SUBJECTS_DATA[key].name.split(" ")[1])
    .join(' | ');

  return (
    <div className="page-layout login-container justify-center">
      <div className="login-content-area max-w-lg flex flex-col items-center gap-4">
        <h2 className="title-text">수능 시뮬레이터 설정</h2>
        
        <div className="actions-panel w-full flex flex-col gap-4">
          
          {/* ## [수정] 빠뜨렸던 시간 모드 및 시작 방식 UI 전체 추가 ## */}
          <div className="setting-group">
            <h3>시간 모드</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setScheduleMode('test')}
                className={`secondary-button flex-1 ${scheduleMode === 'test' ? 'active-button' : ''}`}
              >
                단축 테스트
              </button>
              <button
                onClick={() => setScheduleMode('full')}
                className={`secondary-button flex-1 ${scheduleMode === 'full' ? 'active-button' : ''}`}
              >
                실제 시간
              </button>
            </div>
          </div>

          <div className="setting-group">
            <h3>시작 방식</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setStartMode('immediate')}
                className={`secondary-button flex-1 ${startMode === 'immediate' ? 'active-button' : ''}`}
              >
                즉시 시작
              </button>
              <button
                onClick={() => setStartMode('real-time')}
                className={`secondary-button flex-1 ${startMode === 'real-time' ? 'active-button' : ''}`}
              >
                실제 수능 시간
              </button>
            </div>
          </div>
          
          <div className="setting-group">
            <h3>응시 영역 <span className="text-sm font-normal text-gray-500">({selectedSubjectNames})</span></h3>
            <div className="grid grid-cols-3 gap-2">
              {EXAM_SUBJECT_KEYS.map(key => (
                <button 
                  key={key}
                  onClick={() => handleSubjectToggle(key)}
                  className={`secondary-button ${selectedSubjects[key] ? 'active-button' : ''}`}
                >
                  {EXAM_SUBJECTS_DATA[key].name.split(" ")[1]}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <h3>추가 시간</h3>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setIncludeBreaks(prev => !prev)} className={`secondary-button ${includeBreaks ? 'active-button' : ''}`}>
                    쉬는 시간 포함
                </button>
                <button onClick={() => setIncludeBells(prev => !prev)} className={`secondary-button ${includeBells ? 'active-button' : ''}`}>
                    예비령/준비령 포함
                </button>
            </div>
          </div>

          {selectedSubjects.english && (
            <div className="setting-group">
              <h3>영어 듣기 평가 파일 (선택)</h3>
              <p className="text-xs text-gray-500 mb-2">파일 첨부 시 3교시 시작 타종 없이 듣기 평가가 바로 시작됩니다.</p>
              <div className="flex items-center gap-2">
                  <label htmlFor="listening-file" className="secondary-button cursor-pointer">파일 찾기</label>
                  <input id="listening-file" type="file" accept="audio/mp3" onChange={handleFileChange} className="hidden" />
                  <span className="text-sm text-gray-600 truncate">{fileName || "선택된 파일 없음"}</span>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 mt-4">
              <Link to="/main" className="secondary-button text-center">
                뒤로가기
              </Link>
              <button onClick={handleStartClick} className="primary-button mb-0 flex-1">시뮬레이션 시작</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;