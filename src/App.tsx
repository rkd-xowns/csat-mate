import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
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

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [signupUsername, setSignupUsername] = useState('');
  
  // Firebase 로그인 상태를 관리할 상태
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 첫 로딩 상태 확인

  // 앱이 시작될 때 한번만 실행되어 로그인 상태를 계속 감시합니다.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // 로그인된 유저 정보 또는 null을 저장
      setIsLoading(false); // 로딩 완료
    });
    // 클린업 함수: 컴포넌트가 사라질 때 감시를 중단하여 메모리 누수 방지
    return () => unsubscribe();
  }, []);

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
          {/* --- 누구나 접근 가능한 경로 --- */}
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage setSignupUsername={setSignupUsername} />} />
          <Route path="/signup" element={<SignupPage setSignupUsername={setSignupUsername} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
           <Route path="/pwa-test" element={<PwaFeatureTester />} />

          {/* --- 로그인해야만 접근 가능한 보호된 경로 --- */}
          <Route element={<ProtectedRoute user={user} />}>
            <Route 
              path="/profile-setup" 
              element={<ProfileSetupPage signupUsername={signupUsername} />} 
            />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/main" element={<MainPage />} />
            {/* 나중에 추가될 다른 보호된 페이지들 (예: 마이페이지) */}
          </Route>
        </Routes>
      </PageLayout>
    </div>
  );
}

export default App;
