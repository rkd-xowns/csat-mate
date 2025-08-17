// import { Navigate, Outlet } from 'react-router-dom';
// import { type User } from 'firebase/auth';

// interface ProtectedRouteProps {
//   user: User | null;
// }

// export function ProtectedRoute({ user }: ProtectedRouteProps) {
//   // 사용자가 로그인하지 않았다면(user 객체가 null이면),
//   // 로그인 페이지로 강제 이동시킵니다.
//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }

//   // 로그인했다면, 요청한 페이지(자식 라우트)를 보여줍니다.
//   return <Outlet />;
// }
// src/components/ProtectedRoute.tsx

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { type User } from 'firebase/auth';

interface ProtectedRouteProps {
  user: User | null;
}

export function ProtectedRoute({ user }: ProtectedRouteProps) {
  const location = useLocation();

  // 개발 환경에서는 모든 보호된 경로를 허용합니다.
  if (import.meta.env.DEV) {
    return <Outlet />;
  }
  
  // 로그인한 사용자가 없으면 로그인 페이지로 보냅니다.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 사용자의 로그인 방식을 확인합니다.
  const providerId = user.providerData[0]?.providerId;

  // [수정] 이메일/비밀번호로 가입한 사용자는 이메일 인증을 완료해야만 합니다.
  if (providerId === 'password' && !user.emailVerified) {
    // 현재 경로가 /profile-setup이라면, 아직 인증 대기 중이므로 괜찮습니다.
    // 하지만 그 외 다른 보호된 경로(예: /main)로 가려고 하면 로그인 페이지로 보냅니다.
    if (location.pathname !== '/profile-setup') {
      return <Navigate to="/login" replace />;
    }
  }

  // 모든 조건을 통과하면 요청한 페이지를 보여줍니다.
  return <Outlet />;
}