import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';

export function ActionHandlerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL에서 mode와 oobCode(action code)를 가져옵니다.
  const mode = searchParams.get('mode');
  const actionCode = searchParams.get('oobCode');

  const [message, setMessage] = useState('처리 중...');
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (!mode || !actionCode) {
      setError('잘못된 요청입니다.');
      return;
    }

    switch (mode) {
      case 'resetPassword':
        handleResetPassword(actionCode);
        break;
      case 'verifyEmail':
        handleVerifyEmail(actionCode);
        break;
      default:
        setError('지원하지 않는 요청입니다.');
    }
  }, [mode, actionCode]);

  // 비밀번호 재설정 처리
  const handleResetPassword = async (code: string) => {
    try {
      setError(''); // 로직 시작 시 에러 상태를 초기화합니다.
      await verifyPasswordResetCode(auth, code);
      setMessage('새로운 비밀번호를 입력하세요.');
      setShowPasswordForm(true); // 비밀번호 입력 폼을 보여줍니다.
    } catch (e) {
      setMessage(''); // 에러 발생 시 성공 메시지를 초기화합니다.
      setError('비밀번호 재설정 링크가 유효하지 않거나 만료되었습니다.');
    }
  };
  
  // 새 비밀번호 제출 처리
  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
        setError('비밀번호는 8자 이상이어야 합니다.');
        return;
    }
    if (!actionCode) return;

    try {
      setError(''); // 로직 시작 시 에러 상태를 초기화합니다.
      await confirmPasswordReset(auth, actionCode, newPassword);
      setMessage('비밀번호가 성공적으로 변경되었습니다! 로그인 페이지로 이동합니다.');
      setShowPasswordForm(false);
      setTimeout(() => navigate('/login'), 3000);
    } catch (e) {
      setMessage(''); // 에러 발생 시 성공 메시지를 초기화합니다.
      setError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 이메일 인증 처리
  const handleVerifyEmail = async (code: string) => {
    try {
      setError(''); // 로직 시작 시 에러 상태를 초기화합니다.
      await applyActionCode(auth, code);
      setMessage('이메일 인증이 완료되었습니다! 로그인 페이지로 이동합니다.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (e) {
      setMessage(''); // 에러 발생 시 성공 메시지를 초기화합니다.
      setError('이메일 인증 링크가 유효하지 않거나 만료되었습니다.');
    }
  };

  return (
    <div className="page-layout login-container justify-center">
      <div className="login-content-area max-w-lg flex flex-col items-center">
        <div className="text-center actions-panel w-full">
          <h1 className="title-text">
            {mode === 'resetPassword' ? '비밀번호 재설정' : '이메일 인증'}
          </h1>
          
          {error && <p className="error-message mt-4">{error}</p>}
          {message && !showPasswordForm && <p className="description-text mt-4">{message}</p>}

          {showPasswordForm && (
            <form onSubmit={submitNewPassword} className="w-full flex flex-col gap-4 mt-6">
              <p className="description-text">{message}</p>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 (8자 이상)"
                className="login-input"
              />
              <button type="submit" className="primary-button">비밀번호 변경</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}