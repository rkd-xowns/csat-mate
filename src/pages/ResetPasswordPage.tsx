import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auth = getAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true); // 페이지 로드 시 코드를 확인하므로 true로 시작
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  // 컴포넌트가 마운트되면 URL에서 oobCode를 가져와 유효성을 검사합니다.
  useEffect(() => {
    const oobCode = searchParams.get('oobCode');

    if (!oobCode) {
      setError('유효하지 않은 링크입니다.');
      setIsLoading(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then(() => {
        // 코드가 유효하면 비밀번호 입력 필드를 보여줍니다.
        setIsCodeVerified(true);
        setError('');
      })
      .catch(() => {
        // 코드가 만료되었거나 유효하지 않은 경우
        setError('링크가 만료되었거나 유효하지 않습니다. 다시 시도해주세요.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [auth, searchParams]);

  const handleConfirmReset = async () => {
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    const oobCode = searchParams.get('oobCode');
    if (!oobCode) {
      setError('오류가 발생했습니다. 링크가 유효하지 않습니다.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setMessage('비밀번호가 성공적으로 재설정되었습니다!');
      // 성공 후 3초 뒤에 로그인 페이지로 자동 이동
      setTimeout(() => navigate('/login'), 3000);
    } catch (e) {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
      console.error("Confirm Password Reset Error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <p className="description-text">링크를 확인 중입니다...</p>;
    }
    if (error) {
      return <p className="text-red-500 text-sm text-center">{error}</p>;
    }
    if (message) {
      return (
        <div className="text-center">
          <p className="text-blue-500 text-lg">{message}</p>
          <button
            onClick={() => navigate('/login')}
            className="primary-button mt-4"
          >
            로그인 페이지로 이동
          </button>
        </div>
      );
    }
    if (isCodeVerified) {
      return (
        <div className="actions-panel w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="new-password" style={{color: 'var(--text-secondary)'}}>
              새 비밀번호
            </label>
            <input
              id="new-password"
              type="password"
              placeholder="6자 이상의 새 비밀번호"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="login-input"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="confirm-password" style={{color: 'var(--text-secondary)'}}>
              새 비밀번호 확인
            </label>
            <input
              id="confirm-password"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="login-input"
            />
          </div>
          <button
            onClick={handleConfirmReset}
            className="primary-button mb-0"
            disabled={isLoading}
          >
            {isLoading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </div>
      );
    }
    return null; // 모든 조건이 아닐 경우
  };

  return (
    <div className="page-layout login-container justify-center">
      <div className="login-content-area max-w-lg flex flex-col items-center gap-4">
        <div className="text-center">
          <h1 className="title-text">비밀번호 재설정</h1>
          {!message && !error && isCodeVerified && (
            <p className="description-text">새로운 비밀번호를 입력해주세요.</p>
          )}
        </div>
        {renderContent()}
      </div>
    </div>
  );
}
