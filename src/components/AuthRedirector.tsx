import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { type User } from 'firebase/auth';

interface AuthRedirectorProps {
  user: User | null;
}

export const AuthRedirector: React.FC<AuthRedirectorProps> = ({ user }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // user 상태가 확정된 후에 실행됩니다.
    if (user) {
      // 로그인된 사용자가 있으면 메인 페이지로 보냅니다.
      navigate('/main');
    } else {
      // 로그인된 사용자가 없으면 환영 페이지로 보냅니다.
      navigate('/welcome');
    }
  }, [user, navigate]);

  // 리디렉션되는 동안 잠시 로딩 상태를 보여줍니다.
  return <div>경로를 확인 중입니다...</div>;
};
