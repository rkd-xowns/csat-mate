import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

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

  // 사용자가 익명(게스트)인지 확인하여 환영 메시지를 동적으로 변경합니다.
  const welcomeMessage = user?.isAnonymous 
    ? '게스트님, 환영합니다!' 
    : `${user?.email || '사용자'}님, 환영합니다!`;

  return (
    <div>
      <h1>메인 페이지</h1>
      <p>{welcomeMessage}</p>
      <hr />
      <button onClick={handleLogout}>로그아웃</button>
    </div>
  );
}
