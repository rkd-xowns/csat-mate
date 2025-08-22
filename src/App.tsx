import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebaseConfig';

// 컴포넌트 import
import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { MainPage } from './pages/MainPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { PageLayout } from './components/PageLayout';
import { SettingsPanel } from './components/SettingsPanel';
import { ProtectedRoute } from './components/ProtectedRoute'; // 문지기 import
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { PwaFeatureTester } from './pages/PwaFeatureTester';
import { AuthRedirector } from './components/AuthRedirector';
import SettingsPage from './pages/csat_simulator_setting';
import TestPage from './pages/csat_simulator';
import ReportPage from './pages/ReportPage';
import type { SimulatorSettings, FinishData } from './types/simulator';


function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [signupUsername, setSignupUsername] = useState('');
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [finishData, setFinishData] = useState<FinishData | null>(null);

  const [simulatorSettings, setSimulatorSettings] = useState<SimulatorSettings | null>(null);
  const navigate = useNavigate();

  // 앱이 시작될 때 한번만 실행되어 로그인 상태를 계속 감시합니다.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // 로그인된 유저 정보 또는 null을 저장
      setIsLoading(false); // 로딩 완료
    });
    // 클린업 함수: 컴포넌트가 사라질 때 감시를 중단하여 메모리 누수 방지
    return () => unsubscribe();
  }, []);

  const handleStartSimulator = (settings: SimulatorSettings) => {
    setSimulatorSettings(settings);
    navigate('/simulator/test');
  };

  // ## [추가] 시뮬레이터 종료 핸들러 ##
  const handleFinishSimulator = (result: FinishData) => {
    setSimulatorSettings(null); // 기존 설정 초기화
    setFinishData(result);      // 결과 데이터 저장
    navigate('/simulator/report'); // 보고서 페이지로 이동
  }

  // 첫 로딩 중에는 아무것도 보여주지 않아 화면 깜빡임을 방지
  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="w-screen h-screen">
      <PageLayout>
        <SettingsPanel 
          isOpen={isSettingsOpen} 
          onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
          onClose={() => setIsSettingsOpen(false)}
        />
        <Routes>
          <Route path="/" element={<AuthRedirector user={user} />} />

          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage setSignupUsername={setSignupUsername} />} />
          <Route path="/signup" element={<SignupPage setSignupUsername={setSignupUsername} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/pwa-test" element={<PwaFeatureTester />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute user={user} />}>
            <Route 
              path="/profile-setup" 
              element={<ProfileSetupPage signupUsername={signupUsername} />} 
            />
            <Route path="/main" element={<MainPage />} />

            <Route path="/simulator/settings" element={<SettingsPage onStart={handleStartSimulator} />} />
            {simulatorSettings && (
              <Route 
                path="/simulator/test" 
                element={<TestPage settings={simulatorSettings} onFinish={handleFinishSimulator} />} 
              />
            )}
            <Route 
              path="/simulator/report"
              element={<ReportPage result={finishData} />}
            />
          </Route>
        </Routes>
      </PageLayout>
    </div>
  );
}

export default App;

