import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

// Props 정의
interface ProfileSetupPageProps {
  signupUsername: string;
}

// 과목 선택 옵션
const LEGACY_SUBJECT_OPTIONS = {
  korean: ['화법과 작문', '언어와 매체'],
  math: ['확률과 통계', '미적분', '기하'],
  inquiry: ['생활과 윤리', '윤리와 사상', '한국지리', '세계지리', '동아시아사', '세계사', '물리학Ⅰ', '화학Ⅰ', '생명과학Ⅰ', '지구과학Ⅰ'],
};

const UNIFIED_SUBJECT_OPTIONS = {
  korean: ['공통 국어'],
  math: ['공통 수학'],
  inquiry: ['통합사회', '통합과학'],
};

export function ProfileSetupPage({ signupUsername }: ProfileSetupPageProps) {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState<'profile' | 'subjects' | 'celebration'>('profile');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isUnifiedCurriculum, setIsUnifiedCurriculum] = useState(false);
  const [subjects, setSubjects] = useState({
    korean: '',
    math: '',
    english: '공통 영어',
    inquiry1: '',
    inquiry2: '',
    secondLanguage: '미응시',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProfileNext = () => {
    if (!name.trim() || !birthDate) {
      setError('이름과 생년월일을 모두 입력해주세요.');
      return;
    }
    setError('');

    const birthYear = new Date(birthDate).getFullYear();
    const isUnified = birthYear >= 2009;
    setIsUnifiedCurriculum(isUnified);

    if (isUnified) {
      setSubjects({
        korean: '공통 국어',
        math: '공통 수학',
        english: '공통 영어',
        inquiry1: '통합사회',
        inquiry2: '통합과학',
        secondLanguage: '미응시',
      });
    } else {
      setSubjects({
        korean: '화법과 작문',
        math: '확률과 통계',
        english: '공통 영어',
        inquiry1: '생활과 윤리',
        inquiry2: '사회·문화',
        secondLanguage: '미응시',
      });
    }
    
    setCurrentStep('subjects');
  };

  const handleSubjectsComplete = async () => {
    setIsSubmitting(true);
    setError('');
    const user = auth.currentUser;
    if (!user) {
      setError('사용자 정보가 없습니다. 다시 로그인해주세요.');
      setIsSubmitting(false);
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const profileData = {
        username: signupUsername,
        name,
        birthDate,
        email: user.email,
        subjects,
      };
      await setDoc(userDocRef, profileData);
      console.log("Firestore에 프로필 정보 저장 성공!");
      setCurrentStep('celebration');
    } catch (err) {
      console.error("프로필 저장 오류:", err);
      setError("프로필 정보 저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (currentStep === 'celebration') {
    return (
      <div>
        <h1>🎉 환영합니다!</h1>
        <p>{name}님({signupUsername}), 수능메이트 가입이 완료되었습니다.</p>
        <hr />
        <h3>최종 설정된 과목</h3>
        <ul>
            <li>국어: {subjects.korean}</li>
            <li>수학: {subjects.math}</li>
            <li>영어: {subjects.english}</li>
            <li>탐구 1: {subjects.inquiry1}</li>
            <li>탐구 2: {subjects.inquiry2}</li>
            <li>제2외국어: {subjects.secondLanguage}</li>
        </ul>
        <hr />
        <button onClick={() => navigate('/main')}>수능메이트 시작하기 🚀</button>
      </div>
    );
  }

  return (
    <div>
      <h1>프로필 설정 (현재 테마: {isDarkMode ? '다크' : '라이트'})</h1>
      <hr />

      {currentStep === 'profile' ? (
        <div>
          <h2>1단계: 프로필 정보 입력</h2>
          <div>
            <label>이름: <input type="text" value={name} onChange={e => setName(e.target.value)} /></label>
          </div>
          <div>
            <label>생년월일: <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></label>
          </div>
          <button onClick={handleProfileNext}>다음 (과목 선택)</button>
        </div>
      ) : (
        <div>
          <h2>2단계: 수능 과목 선택</h2>
          <div>
            <label>국어:
              <select value={subjects.korean} onChange={e => setSubjects({...subjects, korean: e.target.value})}>
                {(isUnifiedCurriculum ? UNIFIED_SUBJECT_OPTIONS.korean : LEGACY_SUBJECT_OPTIONS.korean).map(opt => 
                  <option key={opt} value={opt}>{opt}</option>
                )}
              </select>
            </label>
          </div>
          <div>
            <label>수학:
              <select value={subjects.math} onChange={e => setSubjects({...subjects, math: e.target.value})}>
                {(isUnifiedCurriculum ? UNIFIED_SUBJECT_OPTIONS.math : LEGACY_SUBJECT_OPTIONS.math).map(opt => 
                  <option key={opt} value={opt}>{opt}</option>
                )}
              </select>
            </label>
          </div>
          <div>
            <label>탐구 1:
              <select value={subjects.inquiry1} onChange={e => setSubjects({...subjects, inquiry1: e.target.value})}>
                {(isUnifiedCurriculum ? UNIFIED_SUBJECT_OPTIONS.inquiry : LEGACY_SUBJECT_OPTIONS.inquiry).map(opt => 
                  <option key={opt} value={opt}>{opt}</option>
                )}
              </select>
            </label>
          </div>
          <div>
            <label>탐구 2:
              <select value={subjects.inquiry2} onChange={e => setSubjects({...subjects, inquiry2: e.target.value})}>
                {(isUnifiedCurriculum ? UNIFIED_SUBJECT_OPTIONS.inquiry : LEGACY_SUBJECT_OPTIONS.inquiry).map(opt => 
                  <option key={opt} value={opt}>{opt}</option>
                )}
              </select>
            </label>
          </div>
          <hr />
          <button onClick={handleSubjectsComplete} disabled={isSubmitting}>
            {isSubmitting ? '저장 중...' : '프로필 설정 완료'}
          </button>
          <button onClick={() => setCurrentStep('profile')} disabled={isSubmitting}>
            이전 단계로
          </button>
        </div>
      )}
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
