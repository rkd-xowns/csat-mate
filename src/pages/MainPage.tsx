import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

declare const Tone: any;

export function MainPage() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('로그아웃 성공');
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  const goToSimulatorSettings = () => {
      navigate('/simulator/settings');
  }
  // 사용자가 익명(게스트)인지 확인하여 환영 메시지를 동적으로 변경합니다.
  const welcomeMessage = user?.isAnonymous 
    ? '게스트님, 환영합니다!' 
    : `${user?.email || '사용자'}님, 환영합니다!`;

  return (
    <div className="page-layout login-container justify-center">
      <div className="login-content-area max-w-lg flex flex-col items-center gap-4">
        <div className="text-center">
          <h1 className="title-text">메인 페이지</h1>
          <p>{welcomeMessage}</p>
        </div>

        <div className="actions-panel w-full flex flex-col gap-4">
          {/* ## [추가] 수능 시뮬레이터 시작 버튼 ## */}
          <button
            onClick={goToSimulatorSettings}
            className="secondary-button"
          >
            수능 시뮬레이터 시작하기
          </button>
          <button
            onClick={() => navigate('/pwa-test')}
            className="secondary-button"
          >
            PWA 기능 테스트 페이지로 이동
          </button>
          <button
            onClick={handleLogout}
            className="primary-button mb-0"
          >
            로그아웃
          </button>

        </div>
      </div>
    </div>
  );
}
