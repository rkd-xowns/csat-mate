import { Navigate, Outlet } from 'react-router-dom';
import { type User } from 'firebase/auth';

interface ProtectedRouteProps {
  user: User | null;
}

export function ProtectedRoute({ user }: ProtectedRouteProps) {
  // 사용자가 로그인하지 않았다면(user 객체가 null이면),
  // 로그인 페이지로 강제 이동시킵니다.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 로그인했다면, 요청한 페이지(자식 라우트)를 보여줍니다.
  return <Outlet />;
}
